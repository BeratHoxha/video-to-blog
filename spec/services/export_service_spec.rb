require "rails_helper"

RSpec.describe ExportService do
  let(:article) do
    build(:article,
          title: "Test Article",
          content: "<h1>Test Article</h1><p>This is content for export testing.</p>")
  end

  describe ".call" do
    it "generates a PDF blob" do
      result = described_class.call(article: article, format: "pdf")
      expect(result).to be_a(String)
      expect(result.encoding).to eq(Encoding::ASCII_8BIT).or be_a(String)
      expect(result[0..3]).to eq("%PDF")
    end

    it "generates a DOCX blob" do
      result = described_class.call(article: article, format: "docx")
      expect(result).to be_a(String)
      expect(result.length).to be > 0
    end

    it "generates a PPTX blob" do
      result = described_class.call(article: article, format: "pptx")
      expect(result).to be_a(String)
      expect(result.length).to be > 0
    end

    it "raises ExportError for unknown format" do
      expect {
        described_class.call(article: article, format: "csv")
      }.to raise_error(ExportService::ExportError, /Unknown format/)
    end

    it "raises ExportError when content is blank" do
      empty_article = build(:article, content: nil)
      expect {
        described_class.call(article: empty_article, format: "pdf")
      }.to raise_error(ExportService::ExportError, /no content/)
    end
  end
end
