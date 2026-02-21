class ExportService
  class ExportError < StandardError; end

  def self.call(article:, format:)
    new(article: article, format: format).call
  end

  def initialize(article:, format:)
    @article = article
    @format = format.to_s.downcase
  end

  def call
    raise ExportError, "Article has no content to export" \
      if @article.content.blank?

    case @format
    when "pdf" then generate_pdf
    when "docx" then generate_docx
    when "pptx" then generate_pptx
    else raise ExportError, "Unknown format: #{@format}"
    end
  end

  private

  def plain_text
    @plain_text ||= Nokogiri::HTML(@article.content).text
                            .gsub(/\s+/, " ").strip
  end

  def generate_pdf
    pdf = Prawn::Document.new(
      page_size: "A4",
      margin: [50, 60, 50, 60]
    )

    pdf.font_families.update(
      "Inter" => { normal: "Helvetica" }
    )

    pdf.text(@article.title.to_s, size: 24, style: :bold, leading: 6)
    pdf.move_down 12

    paragraphs = plain_text.split(/\n+/).reject(&:blank?)
    paragraphs.each do |paragraph|
      pdf.text(paragraph, size: 11, leading: 4)
      pdf.move_down 8
    end

    pdf.render
  end

  def generate_docx
    tmp = Tempfile.new(["article", ".docx"])
    tmp.close

    Caracal::Document.save(tmp.path) do |doc|
      doc.h1 @article.title.to_s
      doc.p

      paragraphs = plain_text.split(/\n+/).reject(&:blank?)
      paragraphs.each { |para| doc.p para }
    end

    File.binread(tmp.path)
  ensure
    tmp&.unlink
  end

  def generate_pptx
    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: @article.title.to_s.first(30)) do |sheet|
      sheet.add_row(
        [@article.title.to_s],
        style: sheet.styles.add_style(b: true, sz: 16)
      )
      sheet.add_row []

      paragraphs = plain_text.split(/\n+/).reject(&:blank?)
      paragraphs.each { |p| sheet.add_row [p] }
    end

    tmp = Tempfile.new(["article", ".xlsx"])
    tmp.close
    package.serialize(tmp.path)
    File.binread(tmp.path)
  ensure
    tmp&.unlink
  end
end
