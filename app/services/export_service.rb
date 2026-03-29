require "net/http"

class ExportService
  class ExportError < StandardError; end

  LINK_BLUE      = "1155CC".freeze
  CONTAINER_TAGS = %w[div section article figure blockquote].freeze

  def self.call(article:, format:)
    new(article: article, format: format).call
  end

  def initialize(article:, format:)
    @article = article
    @format  = format.to_s.downcase
  end

  def call
    raise ExportError, "Article has no content to export" \
      if @article.content.blank?

    case @format
    when "pdf"  then generate_pdf
    when "docx" then generate_docx
    when "pptx" then generate_pptx
    when "txt"  then generate_txt
    else raise ExportError, "Unknown format: #{@format}"
    end
  end

  private

  # ── HTML → structured blocks ──────────────────────────────────────────────
  #
  # Each block is one of:
  #   { type: :heading,   level: 1..4, text: String }
  #   { type: :paragraph, segments: [...] }
  #   { type: :list_item, segments: [...] }
  #   { type: :image,     src: String }
  #   { type: :hr }
  #
  # Each segment: { text: String, href: String|nil, bold: Boolean, italic: Boolean }

  def content_blocks
    @content_blocks ||= begin
      doc    = Nokogiri::HTML.fragment(@article.content)
      blocks = []
      walk_blocks(doc, blocks)
      blocks
    end
  end

  def walk_blocks(node, blocks)
    node.children.each { |child| walk_child(child, blocks) }
  end

  def walk_child(child, blocks)
    case child.name
    when "h1", "h2", "h3", "h4" then walk_heading_child(child, blocks)
    when "p"                     then walk_para_child(child, blocks)
    when "img"                   then walk_img_child(child, blocks)
    when "hr"                    then blocks << { type: :hr }
    when *CONTAINER_TAGS         then walk_blocks(child, blocks)
    else                              walk_list_child_or_item(child, blocks)
    end
  end

  def walk_list_child_or_item(child, blocks)
    case child.name
    when "ul", "ol" then walk_list_child(child, blocks)
    when "li"       then walk_li_child(child, blocks)
    end
  end

  def walk_li_child(child, blocks)
    segs = inline_segments(child)
    blocks << { type: :list_item, segments: segs } if segs.any?
  end

  def walk_heading_child(child, blocks)
    text = child.text.strip
    blocks << { type: :heading, level: child.name[1].to_i, text: text } if text.present?
  end

  def walk_para_child(child, blocks)
    # TipTap sometimes wraps block images in a <p>; unwrap those first.
    img = child.children.find { |c| c.name == "img" }
    if img && child.text.strip.empty?
      walk_img_child(img, blocks)
    else
      segs = inline_segments(child)
      blocks << { type: :paragraph, segments: segs } if segs.any?
    end
  end

  def walk_img_child(child, blocks)
    src = child["src"].presence
    blocks << { type: :image, src: src } if src
  end

  def walk_list_child(child, blocks)
    child.css("li").each do |li|
      segs = inline_segments(li)
      blocks << { type: :list_item, segments: segs } if segs.any?
    end
  end

  def inline_segments(node, bold: false, italic: false)
    node.children.flat_map do |child|
      if child.text?
        text = child.text
        text.present? ? [{ text: text, href: nil, bold: bold, italic: italic }] : []
      else
        inline_element_segments(child, bold: bold, italic: italic)
      end
    end
  end

  def inline_element_segments(child, bold:, italic:)
    case child.name
    when "a"
      text = child.text.strip
      href = child["href"].presence
      text.present? ? [{ text: text, href: href, bold: bold, italic: italic }] : []
    when "strong", "b"
      inline_segments(child, bold: true, italic: italic)
    when "em", "i"
      inline_segments(child, bold: bold, italic: true)
    when "u", "span", "mark", "code"
      inline_segments(child, bold: bold, italic: italic)
    else
      text = child.text
      text.present? ? [{ text: text, href: nil, bold: bold, italic: italic }] : []
    end
  end

  # Renders a segment list as plain text; appends URLs in parentheses for links.
  def segments_as_text(segments)
    segments.map do |s|
      s[:href].present? ? "#{s[:text]} (#{s[:href]})" : s[:text]
    end.join
  end

  # ── PDF ───────────────────────────────────────────────────────────────────

  def generate_pdf
    pdf = Prawn::Document.new(page_size: "A4", margin: [50, 60, 50, 60])
    pdf.text(@article.title.to_s, size: 24, style: :bold, leading: 6)
    pdf.move_down 12
    content_blocks.each { |block| render_pdf_block(pdf, block) }
    pdf.render
  end

  def render_pdf_block(pdf, block)
    case block[:type]
    when :heading   then render_pdf_heading(pdf, block)
    when :paragraph then render_pdf_paragraph(pdf, block)
    when :list_item then render_pdf_list_item(pdf, block)
    when :image     then render_pdf_image(pdf, block)
    when :hr        then render_pdf_hr(pdf)
    end
  end

  def render_pdf_heading(pdf, block)
    size, space_before = pdf_heading_size(block[:level])
    pdf.move_down space_before
    pdf.text(block[:text], size: size, style: :bold, leading: 4)
    pdf.move_down 4
  end

  def render_pdf_paragraph(pdf, block)
    formatted = segments_to_prawn(block[:segments])
    return if formatted.all? { |f| f[:text].strip.empty? }

    pdf.formatted_text(formatted, size: 11, leading: 4)
    pdf.move_down 8
  end

  def render_pdf_list_item(pdf, block)
    formatted = segments_to_prawn(block[:segments])
    formatted.prepend({ text: "• ", size: 11 })
    pdf.formatted_text(formatted, size: 11, leading: 4, indent_paragraphs: 12)
    pdf.move_down 4
  end

  def render_pdf_image(pdf, block)
    data = fetch_image_data(block[:src])
    return unless data

    pdf.image StringIO.new(data), fit: [430, 300], position: :center
    pdf.move_down 10
  end

  def render_pdf_hr(pdf)
    pdf.move_down 6
    pdf.stroke_color "999999"
    pdf.stroke_horizontal_rule
    pdf.move_down 10
  end

  # Fetches raw image bytes. Tries Active Storage first (avoids an HTTP round-
  # trip), then falls back to a plain HTTP request for external URLs.
  def fetch_image_data(src)
    if src.include?("/rails/active_storage/")
      match = src.match(%r{/rails/active_storage/blobs/(?:redirect|proxy)/([^/?]+)/})
      if match
        blob = ActiveStorage::Blob.find_signed!(match[1])
        return blob.download
      end
    end

    fetch_remote_image(src)
  rescue StandardError => e
    Rails.logger.warn("ExportService: could not embed image #{src}: #{e.message}")
    nil
  end

  def fetch_remote_image(src)
    uri = URI(src)
    Net::HTTP.start(uri.host, uri.port,
                    use_ssl: uri.scheme == "https",
                    read_timeout: 10) do |http|
      http.get(uri.request_uri).body
    end
  end

  def segments_to_prawn(segments)
    segments.map do |seg|
      item   = { text: seg[:text], size: 11 }
      styles = []
      styles << :bold   if seg[:bold]
      styles << :italic if seg[:italic]
      if seg[:href].present?
        item[:link]  = seg[:href]
        item[:color] = LINK_BLUE
        styles << :underline
      end
      item[:styles] = styles unless styles.empty?
      item
    end
  end

  def pdf_heading_size(level)
    case level
    when 1 then [20, 10]
    when 2 then [17, 8]
    when 3 then [14, 6]
    else        [12, 4]
    end
  end

  # ── DOCX ──────────────────────────────────────────────────────────────────

  def generate_docx
    tmp = Tempfile.new(["article", ".docx"])
    tmp.close
    Caracal::Document.save(tmp.path) do |doc|
      doc.h1 @article.title.to_s
      doc.p
      content_blocks.each { |block| render_docx_block(doc, block) }
    end
    File.binread(tmp.path)
  ensure
    tmp&.unlink
  end

  def render_docx_block(doc, block)
    case block[:type]
    when :heading   then doc.send(:"h#{block[:level]}", block[:text])
    when :paragraph then render_docx_para(doc, block)
    when :list_item then render_docx_list_item(doc, block)
    when :hr        then doc.hr
    end
  end

  def render_docx_para(doc, block)
    if block[:segments].any? { |s| s[:href].present? }
      doc.p { render_docx_segments(block[:segments]) }
    else
      doc.p segments_as_text(block[:segments])
    end
  end

  def render_docx_list_item(doc, block)
    if block[:segments].any? { |s| s[:href].present? }
      doc.p do
        text "• "
        render_docx_segments(block[:segments])
      end
    else
      doc.p "• #{segments_as_text(block[:segments])}"
    end
  end

  def render_docx_segments(segments)
    segments.each do |seg|
      if seg[:href].present?
        link seg[:text], seg[:href], color: ExportService::LINK_BLUE, underline: true
      else
        text seg[:text], bold: seg[:bold] || false, italic: seg[:italic] || false
      end
    end
  end

  # ── PPTX ──────────────────────────────────────────────────────────────────

  def generate_pptx
    PptxBuilderService.build(
      title: @article.title.to_s,
      blocks: content_blocks
    )
  end

  # ── TXT ───────────────────────────────────────────────────────────────────

  def generate_txt
    title     = @article.title.to_s
    separator = "=" * [title.length, 60].min
    lines     = [title, separator, ""]
    content_blocks.each { |block| lines.concat(format_txt_block(block)) }
    lines.join("\n")
  end

  def format_txt_block(block)
    case block[:type]
    when :heading
      text = block[:text]
      ["", text, "-" * [text.length, 60].min]
    when :paragraph
      [segments_as_text(block[:segments]), ""]
    when :list_item
      ["  • #{segments_as_text(block[:segments])}"]
    when :hr
      ["", "-" * 40]
    else
      []
    end
  end
end
