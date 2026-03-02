class ExportService
  class ExportError < StandardError; end

  LINK_BLUE = "1155CC".freeze

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
    node.children.each do |child|
      case child.name
      when "h1", "h2", "h3", "h4"
        text = child.text.strip
        blocks << { type: :heading, level: child.name[1].to_i, text: text } if text.present?
      when "p"
        # TipTap sometimes wraps block images in a <p>; unwrap those first.
        img = child.children.find { |c| c.name == "img" }
        if img && child.text.strip.empty?
          src = img["src"].presence
          blocks << { type: :image, src: src } if src
        else
          segs = inline_segments(child)
          blocks << { type: :paragraph, segments: segs } if segs.any?
        end
      when "img"
        src = child["src"].presence
        blocks << { type: :image, src: src } if src
      when "ul", "ol"
        child.css("li").each do |li|
          segs = inline_segments(li)
          blocks << { type: :list_item, segments: segs } if segs.any?
        end
      when "li"
        segs = inline_segments(child)
        blocks << { type: :list_item, segments: segs } if segs.any?
      when "hr"
        blocks << { type: :hr }
      when "div", "section", "article", "figure", "blockquote"
        walk_blocks(child, blocks)
      end
    end
  end

  def inline_segments(node, bold: false, italic: false)
    node.children.flat_map do |child|
      if child.text?
        text = child.text
        text.present? ? [{ text: text, href: nil, bold: bold, italic: italic }] : []
      else
        case child.name
        when "a"
          text = child.text.strip
          href = child["href"].presence
          text.present? ? [{ text: text, href: href, bold: bold, italic: italic }] : []
        when "strong", "b"
          inline_segments(child, bold: true,  italic: italic)
        when "em", "i"
          inline_segments(child, bold: bold,  italic: true)
        when "u", "span", "mark", "code"
          inline_segments(child, bold: bold,  italic: italic)
        else
          text = child.text
          text.present? ? [{ text: text, href: nil, bold: bold, italic: italic }] : []
        end
      end
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

    content_blocks.each do |block|
      case block[:type]
      when :heading
        size, space_before = pdf_heading_size(block[:level])
        pdf.move_down space_before
        pdf.text(block[:text], size: size, style: :bold, leading: 4)
        pdf.move_down 4

      when :paragraph
        formatted = segments_to_prawn(block[:segments])
        next if formatted.all? { |f| f[:text].strip.empty? }

        pdf.formatted_text(formatted, size: 11, leading: 4)
        pdf.move_down 8

      when :list_item
        formatted = [{ text: "• ", size: 11 }] + segments_to_prawn(block[:segments])
        pdf.formatted_text(formatted, size: 11, leading: 4, indent_paragraphs: 12)
        pdf.move_down 4

      when :image
        data = fetch_image_data(block[:src])
        if data
          pdf.image StringIO.new(data), fit: [430, 300], position: :center
          pdf.move_down 10
        end

      when :hr
        pdf.move_down 6
        pdf.stroke_color "999999"
        pdf.stroke_horizontal_rule
        pdf.move_down 10
      end
    end

    pdf.render
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

    require "open-uri"
    URI.open(src, read_timeout: 10).read
  rescue StandardError => e
    Rails.logger.warn("ExportService: could not embed image #{src}: #{e.message}")
    nil
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

      content_blocks.each do |block|
        case block[:type]
        when :heading
          doc.send(:"h#{block[:level]}", block[:text])

        when :paragraph
          # Build the paragraph with inline hyperlinks where present
          if block[:segments].any? { |s| s[:href].present? }
            doc.p do
              block[:segments].each do |seg|
                if seg[:href].present?
                  link seg[:text], seg[:href], color: ExportService::LINK_BLUE, underline: true
                else
                  text seg[:text],
                       bold: seg[:bold] || false,
                       italic: seg[:italic] || false
                end
              end
            end
          else
            text = segments_as_text(block[:segments])
            doc.p text
          end

        when :list_item
          if block[:segments].any? { |s| s[:href].present? }
            doc.p do
              text "• "
              block[:segments].each do |seg|
                if seg[:href].present?
                  link seg[:text], seg[:href], color: ExportService::LINK_BLUE, underline: true
                else
                  text seg[:text]
                end
              end
            end
          else
            doc.p "• #{segments_as_text(block[:segments])}"
          end

        when :hr
          doc.hr
        end
      end
    end

    File.binread(tmp.path)
  ensure
    tmp&.unlink
  end

  # ── PPTX ──────────────────────────────────────────────────────────────────

  def generate_pptx
    PptxBuilderService.build(
      title:  @article.title.to_s,
      blocks: content_blocks
    )
  end

  # ── TXT ───────────────────────────────────────────────────────────────────

  def generate_txt
    title     = @article.title.to_s
    separator = "=" * [title.length, 60].min
    lines     = [title, separator, ""]

    content_blocks.each do |block|
      case block[:type]
      when :heading
        text = block[:text]
        lines << ""
        lines << text
        lines << "-" * [text.length, 60].min
      when :paragraph
        lines << segments_as_text(block[:segments])
        lines << ""
      when :list_item
        lines << "  • #{segments_as_text(block[:segments])}"
      when :hr
        lines << ""
        lines << "-" * 40
      end
    end

    lines.join("\n")
  end
end
