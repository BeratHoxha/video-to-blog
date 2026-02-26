# frozen_string_literal: true

require "zip"

# Builds a valid .pptx file from a title + content blocks.
# Each heading becomes one content slide (with bullets + image placeholder).
# The first slide is a title slide.
class PptxBuilderService
  SW = 9_144_000 # slide width  (10 inches)
  SH = 5_143_500 # slide height (5.625 inches, 16:9)

  BG     = "0F172A"
  ACCENT = "10B981"
  WHITE  = "FFFFFF"
  LIGHT  = "E2E8F0"
  MUTED  = "64748B"
  BORDER = "334155"
  FONT   = "Calibri"

  def self.build(title:, blocks:)
    new(title, blocks).build
  end

  def initialize(title, blocks)
    @title  = title
    @slides = collect_slides(blocks)
  end

  def build
    Zip::OutputStream.write_buffer do |z|
      put z, "[Content_Types].xml",                             content_types_xml
      put z, "_rels/.rels",                                     root_rels_xml
      put z, "docProps/app.xml",                                app_xml
      put z, "docProps/core.xml",                               core_xml
      put z, "ppt/theme/theme1.xml",                            theme_xml
      put z, "ppt/slideMasters/slideMaster1.xml",               slide_master_xml
      put z, "ppt/slideMasters/_rels/slideMaster1.xml.rels",    slide_master_rels_xml
      put z, "ppt/slideLayouts/slideLayout1.xml",               slide_layout_xml
      put z, "ppt/slideLayouts/_rels/slideLayout1.xml.rels",    slide_layout_rels_xml
      put z, "ppt/presentation.xml",                            presentation_xml
      put z, "ppt/_rels/presentation.xml.rels",                 presentation_rels_xml
      @slides.each_with_index do |slide, i|
        n = i + 1
        put z, "ppt/slides/slide#{n}.xml",        slide_xml(slide)
        put z, "ppt/slides/_rels/slide#{n}.xml.rels", slide_rels_xml
      end
    end.string
  end

  private

  # ── Helpers ──────────────────────────────────────────────────────────────

  def put(zip, path, content)
    zip.put_next_entry(path)
    zip.write(content)
  end

  def xe(str)
    str.to_s
      .gsub("&", "&amp;")
      .gsub("<", "&lt;")
      .gsub(">", "&gt;")
      .gsub('"', "&quot;")
  end

  BULLETS_PER_SLIDE = 4
  BULLET_MAX_LEN    = 110

  def collect_slides(blocks)
    slides   = [{ kind: :title, title: @title }]
    sections = []
    current  = nil

    blocks.each do |b|
      case b[:type]
      when :heading
        current = { title: b[:text], blocks: [] }
        sections << current
      when :paragraph, :list_item
        current[:blocks] << b if current
      end
    end

    sections.each do |section|
      bullets = summarize_section(section[:title], section[:blocks])
      slides << { kind: :content, title: section[:title], bullets: bullets }
    end

    slides
  end

  # Calls OpenAI to produce 3-4 concise slide bullets for a section.
  # Falls back to clipped first sentences if the API call fails.
  def summarize_section(title, blocks)
    text_parts = blocks.map do |b|
      b[:segments].map { |s| s[:text] }.join.strip
    end.reject(&:blank?)

    return [] if text_parts.empty?

    full_text = text_parts.join("\n\n")

    messages = [
      {
        role: "system",
        content: <<~PROMPT.strip
          You are a presentation assistant. Given a section of an article, \
          write 3-4 concise bullet points for a presentation slide. \
          Each bullet must be short (max 10 words), punchy, and capture \
          the key insight. Reply with only the bullet points, one per line, \
          no bullet characters or numbering.
        PROMPT
      },
      {
        role: "user",
        content: "Section: #{title}\n\n#{full_text}"
      }
    ]

    response = OpenaiClientService.chat_with_fallback(
      messages: messages,
      primary_model: "gpt-4.1-mini",
      fallback_model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 200
    )

    parse_bullets(response)
  rescue StandardError
    text_parts.first(BULLETS_PER_SLIDE).map { |t| clip(first_sentence(t)) }
  end

  def parse_bullets(text)
    text.to_s
        .split("\n")
        .map { |line| line.gsub(/\A[\s\-•*\d.]+/, "").strip }
        .reject(&:blank?)
        .first(BULLETS_PER_SLIDE)
  end

  def first_sentence(text)
    text.split(/(?<=[.!?])\s+/, 2).first.to_s.strip
  end

  def clip(text, max: BULLET_MAX_LEN)
    return text if text.length <= max

    text[0, max].rstrip.sub(/[.,;:\-\u2014]+$/, "") + "\u2026"
  end

  # ── Content Types ────────────────────────────────────────────────────────

  def content_types_xml
    slide_ct = "application/vnd.openxmlformats-officedocument" \
               ".presentationml.slide+xml"
    overrides = @slides.each_index.map do |i|
      %(<Override PartName="/ppt/slides/slide#{i + 1}.xml" ) +
        %(ContentType="#{slide_ct}"/>)
    end.join("\n    ")

    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels"
          ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/ppt/presentation.xml"
          ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml"
          ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml"
          ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/theme/theme1.xml"
          ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/docProps/app.xml"
          ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
        <Override PartName="/docProps/core.xml"
          ContentType="application/package.core-properties+xml"/>
        #{overrides}
      </Types>
    XML
  end

  # ── Relationships ────────────────────────────────────────────────────────

  def root_rels_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Target="ppt/presentation.xml"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"/>
        <Relationship Id="rId2" Target="docProps/core.xml"
          Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties"/>
        <Relationship Id="rId3" Target="docProps/app.xml"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties"/>
      </Relationships>
    XML
  end

  def presentation_rels_xml
    slide_type = "http://schemas.openxmlformats.org/officeDocument/" \
                 "2006/relationships/slide"
    master_type = "http://schemas.openxmlformats.org/officeDocument/" \
                  "2006/relationships/slideMaster"
    rels = @slides.each_index.map do |i|
      n = i + 1
      %(  <Relationship Id="rId#{n + 1}" Type="#{slide_type}" ) +
        %(Target="slides/slide#{n}.xml"/>)
    end.join("\n")

    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="#{master_type}"
          Target="slideMasters/slideMaster1.xml"/>
      #{rels}
      </Relationships>
    XML
  end

  def slide_master_rels_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"
          Target="../theme/theme1.xml"/>
        <Relationship Id="rId2"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
          Target="../slideLayouts/slideLayout1.xml"/>
      </Relationships>
    XML
  end

  def slide_layout_rels_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"
          Target="../slideMasters/slideMaster1.xml"/>
      </Relationships>
    XML
  end

  def slide_rels_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1"
          Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
          Target="../slideLayouts/slideLayout1.xml"/>
      </Relationships>
    XML
  end

  # ── Metadata ─────────────────────────────────────────────────────────────

  def app_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
        <Application>VideoToBlog</Application>
        <Slides>#{@slides.size}</Slides>
      </Properties>
    XML
  end

  def core_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <cp:coreProperties
          xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
          xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>#{xe(@title)}</dc:title>
        <cp:revision>1</cp:revision>
      </cp:coreProperties>
    XML
  end

  # ── Theme ────────────────────────────────────────────────────────────────

  def theme_xml
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="VideoToBlog">
        <a:themeElements>
          <a:clrScheme name="VideoToBlog">
            <a:dk1><a:srgbClr val="#{BG}"/></a:dk1>
            <a:lt1><a:srgbClr val="#{WHITE}"/></a:lt1>
            <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
            <a:lt2><a:srgbClr val="#{LIGHT}"/></a:lt2>
            <a:accent1><a:srgbClr val="#{ACCENT}"/></a:accent1>
            <a:accent2><a:srgbClr val="6366F1"/></a:accent2>
            <a:accent3><a:srgbClr val="F59E0B"/></a:accent3>
            <a:accent4><a:srgbClr val="EF4444"/></a:accent4>
            <a:accent5><a:srgbClr val="3B82F6"/></a:accent5>
            <a:accent6><a:srgbClr val="8B5CF6"/></a:accent6>
            <a:hlink><a:srgbClr val="#{ACCENT}"/></a:hlink>
            <a:folHlink><a:srgbClr val="059669"/></a:folHlink>
          </a:clrScheme>
          <a:fontScheme name="VideoToBlog">
            <a:majorFont>
              <a:latin typeface="#{FONT}"/>
              <a:ea typeface=""/><a:cs typeface=""/>
            </a:majorFont>
            <a:minorFont>
              <a:latin typeface="#{FONT}"/>
              <a:ea typeface=""/><a:cs typeface=""/>
            </a:minorFont>
          </a:fontScheme>
          <a:fmtScheme name="VideoToBlog">
            <a:fillStyleLst>
              <a:solidFill><a:srgbClr val="#{BG}"/></a:solidFill>
              <a:solidFill><a:srgbClr val="1E293B"/></a:solidFill>
              <a:solidFill><a:srgbClr val="334155"/></a:solidFill>
            </a:fillStyleLst>
            <a:lnStyleLst>
              <a:ln w="6350"><a:solidFill><a:srgbClr val="#{BORDER}"/></a:solidFill></a:ln>
              <a:ln w="12700"><a:solidFill><a:srgbClr val="#{BORDER}"/></a:solidFill></a:ln>
              <a:ln w="19050"><a:solidFill><a:srgbClr val="#{BORDER}"/></a:solidFill></a:ln>
            </a:lnStyleLst>
            <a:effectStyleLst>
              <a:effectStyle><a:effectLst/></a:effectStyle>
              <a:effectStyle><a:effectLst/></a:effectStyle>
              <a:effectStyle><a:effectLst/></a:effectStyle>
            </a:effectStyleLst>
            <a:bgFillStyleLst>
              <a:solidFill><a:srgbClr val="#{BG}"/></a:solidFill>
              <a:solidFill><a:srgbClr val="1E293B"/></a:solidFill>
              <a:solidFill><a:srgbClr val="#{BG}"/></a:solidFill>
            </a:bgFillStyleLst>
          </a:fmtScheme>
        </a:themeElements>
      </a:theme>
    XML
  end

  # ── Slide Master ─────────────────────────────────────────────────────────

  def slide_master_xml
    ns = pml_ns
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <p:sldMaster #{ns}>
        <p:cSld>
          <p:bg>
            <p:bgPr>
              <a:solidFill><a:srgbClr val="#{BG}"/></a:solidFill>
              <a:effectLst/>
            </p:bgPr>
          </p:bg>
          <p:spTree>
            #{grp_sp_pr}
          </p:spTree>
        </p:cSld>
        <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2"
          accent1="accent1" accent2="accent2" accent3="accent3"
          accent4="accent4" accent5="accent5" accent6="accent6"
          hlink="hlink" folHlink="folHlink"/>
        <p:sldLayoutIdLst>
          <p:sldLayoutId id="2147483649" r:id="rId2"/>
        </p:sldLayoutIdLst>
        <p:txStyles>
          <p:titleStyle>
            <a:lvl1pPr>
              <a:defRPr lang="en-US" sz="3200" b="1" dirty="0">
                <a:solidFill><a:srgbClr val="#{WHITE}"/></a:solidFill>
                <a:latin typeface="#{FONT}"/>
              </a:defRPr>
            </a:lvl1pPr>
          </p:titleStyle>
          <p:bodyStyle>
            <a:lvl1pPr>
              <a:defRPr lang="en-US" sz="1800" dirty="0">
                <a:solidFill><a:srgbClr val="#{LIGHT}"/></a:solidFill>
                <a:latin typeface="#{FONT}"/>
              </a:defRPr>
            </a:lvl1pPr>
          </p:bodyStyle>
          <p:otherStyle>
            <a:defPPr><a:defRPr lang="en-US" dirty="0"/></a:defPPr>
          </p:otherStyle>
        </p:txStyles>
      </p:sldMaster>
    XML
  end

  # ── Slide Layout ─────────────────────────────────────────────────────────

  def slide_layout_xml
    ns = pml_ns
    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <p:sldLayout #{ns} type="blank" preserve="1">
        <p:cSld name="Blank">
          <p:spTree>
            #{grp_sp_pr}
          </p:spTree>
        </p:cSld>
        <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
      </p:sldLayout>
    XML
  end

  # ── Presentation ─────────────────────────────────────────────────────────

  def presentation_xml
    ns = pml_ns
    slide_ids = @slides.each_index.map do |i|
      %(<p:sldId id="#{256 + i}" r:id="rId#{i + 2}"/>)
    end.join("\n      ")

    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <p:presentation #{ns} saveSubsetFonts="1">
        <p:sldMasterIdLst>
          <p:sldMasterId id="2147483648" r:id="rId1"/>
        </p:sldMasterIdLst>
        <p:sldIdLst>
          #{slide_ids}
        </p:sldIdLst>
        <p:sldSz cx="#{SW}" cy="#{SH}"/>
        <p:notesSz cx="#{SH}" cy="#{SW}"/>
      </p:presentation>
    XML
  end

  # ── Slides ───────────────────────────────────────────────────────────────

  def slide_xml(slide)
    ns     = pml_ns
    shapes = slide[:kind] == :title ?
               title_slide_shapes(slide[:title]) :
               content_slide_shapes(slide[:title], slide[:bullets])

    <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <p:sld #{ns}>
        <p:cSld>
          <p:bg>
            <p:bgPr>
              <a:solidFill><a:srgbClr val="#{BG}"/></a:solidFill>
              <a:effectLst/>
            </p:bgPr>
          </p:bg>
          <p:spTree>
            #{grp_sp_pr}
            #{shapes}
          </p:spTree>
        </p:cSld>
        <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
      </p:sld>
    XML
  end

  # ── Title slide ───────────────────────────────────────────────────────────

  def title_slide_shapes(title)
    [
      rect_shape(id: 2, name: "LeftStripe",
                 x: 0, y: 0, cx: 55_000, cy: SH, fill: ACCENT),
      rect_shape(id: 3, name: "BottomBar",
                 x: 0, y: SH - 100_000, cx: SW, cy: 100_000, fill: ACCENT),
      text_shape(id: 4, name: "Title",
                 x: 457_200, y: 1_371_600, cx: 8_229_600, cy: 1_800_000,
                 text: xe(title), sz: 4400, bold: true,
                 color: WHITE, align: "ctr", anchor: "ctr"),
      text_shape(id: 5, name: "Subtitle",
                 x: 457_200, y: 3_300_000, cx: 8_229_600, cy: 400_000,
                 text: "Presentation", sz: 2000, bold: false,
                 color: MUTED, align: "ctr", anchor: "ctr")
    ].join("\n    ")
  end

  # ── Content slide ─────────────────────────────────────────────────────────

  def content_slide_shapes(title, bullets)
    bullet_cx = 5_100_000
    content_y  = 800_000
    content_cy = SH - content_y - 150_000
    img_x      = 457_200 + bullet_cx + 228_600
    img_cx     = SW - img_x - 200_000

    [
      rect_shape(id: 2, name: "TopBar",
                 x: 0, y: 0, cx: SW, cy: 28_000, fill: ACCENT),
      text_shape(id: 3, name: "SectionTitle",
                 x: 457_200, y: 80_000, cx: 8_229_600, cy: 571_500,
                 text: xe(title), sz: 2800, bold: true,
                 color: WHITE, align: "l", anchor: "ctr"),
      rect_shape(id: 4, name: "Divider",
                 x: 457_200, y: 690_000, cx: 8_229_600, cy: 9_525,
                 fill: ACCENT),
      bullets_shape(id: 5,
                    x: 457_200, y: content_y,
                    cx: bullet_cx, cy: content_cy,
                    bullets: bullets),
      placeholder_shape(id: 6,
                        x: img_x, y: content_y,
                        cx: img_cx, cy: content_cy)
    ].join("\n    ")
  end

  # ── Shape builders ────────────────────────────────────────────────────────

  def grp_sp_pr
    <<~XML.strip
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    XML
  end

  def rect_shape(id:, name:, x:, y:, cx:, cy:, fill:)
    <<~XML.strip
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="#{id}" name="#{name}"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="#{x}" y="#{y}"/><a:ext cx="#{cx}" cy="#{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="#{fill}"/></a:solidFill>
          <a:ln><a:noFill/></a:ln>
        </p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
      </p:sp>
    XML
  end

  def text_shape(id:, name:, x:, y:, cx:, cy:,
                 text:, sz:, bold:, color:, align:, anchor:)
    b = bold ? "1" : "0"
    <<~XML.strip
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="#{id}" name="#{name}"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="#{x}" y="#{y}"/><a:ext cx="#{cx}" cy="#{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/><a:ln><a:noFill/></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0" anchor="#{anchor}"/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="#{align}"/>
            <a:r>
              <a:rPr lang="en-US" sz="#{sz}" b="#{b}" dirty="0">
                <a:solidFill><a:srgbClr val="#{color}"/></a:solidFill>
                <a:latin typeface="#{FONT}"/>
              </a:rPr>
              <a:t>#{text}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    XML
  end

  def bullets_shape(id:, x:, y:, cx:, cy:, bullets:)
    paras = if bullets.empty?
              empty_para(MUTED, "No content")
            else
              bullets.map { |b| bullet_para(b) }.join("\n")
            end

    <<~XML.strip
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="#{id}" name="BulletContent"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="#{x}" y="#{y}"/><a:ext cx="#{cx}" cy="#{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/><a:ln><a:noFill/></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0" anchor="t"/>
          <a:lstStyle/>
          #{paras}
        </p:txBody>
      </p:sp>
    XML
  end

  def placeholder_shape(id:, x:, y:, cx:, cy:)
    <<~XML.strip
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="#{id}" name="ImagePlaceholder"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="#{x}" y="#{y}"/><a:ext cx="#{cx}" cy="#{cy}"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
          <a:ln w="19050" cmpd="sng">
            <a:solidFill><a:srgbClr val="#{BORDER}"/></a:solidFill>
            <a:prstDash val="dash"/>
          </a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0" anchor="ctr"/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r>
              <a:rPr lang="en-US" sz="1400" dirty="0">
                <a:solidFill><a:srgbClr val="#{BORDER}"/></a:solidFill>
                <a:latin typeface="#{FONT}"/>
              </a:rPr>
              <a:t>[ Add Image Here ]</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    XML
  end

  def bullet_para(text)
    <<~XML.strip
      <a:p>
        <a:pPr marL="342900" indent="-342900">
          <a:buChar char="&#x2022;"/>
        </a:pPr>
        <a:r>
          <a:rPr lang="en-US" sz="1800" dirty="0">
            <a:solidFill><a:srgbClr val="#{LIGHT}"/></a:solidFill>
            <a:latin typeface="#{FONT}"/>
          </a:rPr>
          <a:t>#{xe(text)}</a:t>
        </a:r>
      </a:p>
    XML
  end

  def empty_para(color, text)
    <<~XML.strip
      <a:p>
        <a:pPr><a:buNone/></a:pPr>
        <a:r>
          <a:rPr lang="en-US" sz="1800" dirty="0">
            <a:solidFill><a:srgbClr val="#{color}"/></a:solidFill>
            <a:latin typeface="#{FONT}"/>
          </a:rPr>
          <a:t>#{xe(text)}</a:t>
        </a:r>
      </a:p>
    XML
  end

  def pml_ns
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' \
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' \
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'
  end
end
