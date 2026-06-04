import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def get_base_styles():
    styles = getSampleStyleSheet()
    
    # Custom colors
    PRIMARY_COLOR = colors.HexColor("#0F172A") # Deep Slate
    SECONDARY_COLOR = colors.HexColor("#0D9488") # Teal
    TEXT_COLOR = colors.HexColor("#334155") # Muted slate text
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_COLOR,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=TEXT_COLOR,
        spaceAfter=25
    )
    
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY_COLOR,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_COLOR,
        spaceAfter=8
    )

    kpi_title_style = ParagraphStyle(
        'KPITitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#64748B"),
        alignment=1 # Center
    )

    kpi_value_style = ParagraphStyle(
        'KPIValue',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=16,
        textColor=PRIMARY_COLOR,
        alignment=1 # Center
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=TEXT_COLOR
    )

    return {
        "title": title_style,
        "subtitle": subtitle_style,
        "h2": h2_style,
        "body": body_style,
        "kpi_title": kpi_title_style,
        "kpi_value": kpi_value_style,
        "th": table_header_style,
        "td": table_cell_style
    }

def draw_header_footer(canvas, doc):
    canvas.saveState()
    # Draw top accent bar
    canvas.setFillColor(colors.HexColor("#0D9488")) # Teal
    canvas.rect(0, letter[1] - 8, letter[0], 8, stroke=0, fill=1)
    
    # Draw footer
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor("#94A3B8"))
    canvas.drawString(inch, 0.4 * inch, "InsightBoard - Decision Intelligence Platform")
    canvas.drawRightString(letter[0] - inch, 0.4 * inch, f"Page {doc.page} | Confidential")
    canvas.restoreState()

def build_pdf_report(report_type, data):
    """
    Generates a PDF based on report_type ('executive_summary', 'quarterly_report', 'revenue_report')
    using ReportLab and returns a raw bytes buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54, # 0.75 in
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = get_base_styles()
    story = []
    
    # Header Section
    date_str = datetime.datetime.now().strftime("%B %d, %Y")
    
    if report_type == "executive_summary":
        story.append(Paragraph("Executive KPI Performance Summary", styles["title"]))
        story.append(Paragraph(f"Generated on {date_str} | Platform: InsightBoard", styles["subtitle"]))
        
        story.append(Paragraph("Key Performance Indicators (KPIs)", styles["h2"]))
        
        # Create KPI cards layout (2x3 grid as a table)
        kpi_data = [
            [
                Paragraph("Total Revenue", styles["kpi_title"]),
                Paragraph("Net Profit", styles["kpi_title"]),
                Paragraph("Profit Margin", styles["kpi_title"])
            ],
            [
                Paragraph(data["revenue"], styles["kpi_value"]),
                Paragraph(data["profit"], styles["kpi_value"]),
                Paragraph(data["margin"], styles["kpi_value"])
            ],
            [
                Paragraph("Customer Growth (YoY)", styles["kpi_title"]),
                Paragraph("Monthly Recurring Revenue", styles["kpi_title"]),
                Paragraph("CAC (Avg)", styles["kpi_title"])
            ],
            [
                Paragraph(data["customer_growth"], styles["kpi_value"]),
                Paragraph(data["mrr"], styles["kpi_value"]),
                Paragraph(data["cac"], styles["kpi_value"])
            ]
        ]
        
        kpi_table = Table(kpi_data, colWidths=[168, 168, 168])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F8FAFC")),
            ('BACKGROUND', (0,2), (-1,2), colors.HexColor("#F8FAFC")),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 15))
        
        # Recommendations & Regional insights
        story.append(Paragraph("Strategic Insights & Recommendations", styles["h2"]))
        story.append(Paragraph("Based on operational data for the current fiscal periods, the system has flags for immediate action:", styles["body"]))
        
        recs = data.get("recommendations", [])
        for i, rec in enumerate(recs[:3], 1):
            story.append(Paragraph(f"<b>{i}. {rec['title']}</b> (Category: {rec['category']})", styles["body"]))
            story.append(Paragraph(f"<i>Description:</i> {rec['description']}", styles["body"]))
            story.append(Paragraph(f"<i>Recommended Actions:</i> {', '.join(rec['actions'])}", styles["body"]))
            story.append(Spacer(1, 8))
            
    elif report_type == "quarterly_report":
        story.append(Paragraph("Quarterly Business Performance Report", styles["title"]))
        story.append(Paragraph(f"Fiscal Period Performance Analysis | Generated {date_str}", styles["subtitle"]))
        
        story.append(Paragraph("Executive Overview", styles["h2"]))
        story.append(Paragraph("This quarterly report details performance indicators, comparing actual metrics to targets across business segments. Over the past 5 fiscal years, InsightBoard has tracked continuous scale and customer retention indicators.", styles["body"]))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("Quarter-over-Quarter Metrics", styles["h2"]))
        
        # Table of quarterly performance
        table_content = [
            [
                Paragraph("Quarter", styles["th"]),
                Paragraph("Revenue", styles["th"]),
                Paragraph("COGS", styles["th"]),
                Paragraph("OpEx", styles["th"]),
                Paragraph("Net Profit", styles["th"]),
                Paragraph("Margin", styles["th"])
            ]
        ]
        
        for q in data.get("quarters", []):
            table_content.append([
                Paragraph(q["quarter"], styles["td"]),
                Paragraph(q["revenue"], styles["td"]),
                Paragraph(q["cogs"], styles["td"]),
                Paragraph(q["opex"], styles["td"]),
                Paragraph(q["profit"], styles["td"]),
                Paragraph(q["margin"], styles["td"])
            ])
            
        q_table = Table(table_content, colWidths=[80, 85, 85, 85, 85, 84])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")])
        ]))
        story.append(q_table)
        
    else: # revenue_report
        story.append(Paragraph("Revenue Performance Analytics", styles["title"]))
        story.append(Paragraph(f"Sales and Product Penetration Analysis | Generated {date_str}", styles["subtitle"]))
        
        story.append(Paragraph("Revenue Breakdowns by Segment", styles["h2"]))
        story.append(Paragraph("This report provides a structural breakdown of revenues by Regional Performance and Product Portfolio, highlighting growth vectors and market share.", styles["body"]))
        story.append(Spacer(1, 10))
        
        # Region Revenue Table
        story.append(Paragraph("Regional Sales Breakdown", styles["h2"]))
        r_content = [
            [
                Paragraph("Region", styles["th"]),
                Paragraph("Sales Volume", styles["th"]),
                Paragraph("Total Revenue", styles["th"]),
                Paragraph("Avg Unit Price", styles["th"]),
                Paragraph("Share %", styles["th"])
            ]
        ]
        for r in data.get("regions", []):
            r_content.append([
                Paragraph(r["name"], styles["td"]),
                Paragraph(r["volume"], styles["td"]),
                Paragraph(r["revenue"], styles["td"]),
                Paragraph(r["avg_price"], styles["td"]),
                Paragraph(r["share"], styles["td"])
            ])
        r_table = Table(r_content, colWidths=[120, 90, 110, 90, 94])
        r_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0D9488")), # Teal Header
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")])
        ]))
        story.append(r_table)
        
        story.append(Spacer(1, 15))
        story.append(Paragraph("Product Performance Breakdown", styles["h2"]))
        p_content = [
            [
                Paragraph("Product Name", styles["th"]),
                Paragraph("Category", styles["th"]),
                Paragraph("Sales Volume", styles["th"]),
                Paragraph("Total Revenue", styles["th"]),
                Paragraph("Net Profit", styles["th"])
            ]
        ]
        for p in data.get("products", []):
            p_content.append([
                Paragraph(p["name"], styles["td"]),
                Paragraph(p["category"], styles["td"]),
                Paragraph(p["volume"], styles["td"]),
                Paragraph(p["revenue"], styles["td"]),
                Paragraph(p["profit"], styles["td"])
            ])
        p_table = Table(p_content, colWidths=[120, 90, 90, 110, 94])
        p_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")])
        ]))
        story.append(p_table)

    # Build the document
    doc.build(story, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    buffer.seek(0)
    return buffer.getvalue()
