from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import tempfile
from typing import List, Dict, Any

def generate_pdf_report(session_id: str, answers: List[str], scores: List[Dict], summary: str) -> str:
    fd, path = tempfile.mkstemp(suffix='.pdf')
    c = canvas.Canvas(path, pagesize=letter)
    width, height = letter
    y = height - 40
    c.setFont('Helvetica-Bold', 16)
    c.drawString(40, y, f"Interview Report: {session_id}")
    y -= 40
    c.setFont('Helvetica', 12)
    c.drawString(40, y, f"Summary: {summary}")
    y -= 40
    for i, (ans, score) in enumerate(zip(answers, scores)):
        c.drawString(40, y, f"Q{i+1}: Score {score['score']}/10 - {score['feedback']}")
        y -= 20
        c.drawString(60, y, f"Answer: {ans[:80]}...")
        y -= 30
        if y < 100:
            c.showPage()
            y = height - 40
    c.save()
    return path

def generate_enhanced_pdf_report(report_data: Dict[str, Any]) -> str:
    """Generate enhanced PDF report with detailed feedback and analytics"""
    fd, path = tempfile.mkstemp(suffix='.pdf')
    doc = SimpleDocTemplate(path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=30,
        alignment=1  # Center
    )
    story.append(Paragraph(f"Interview Report - {report_data['candidate_name']}", title_style))
    story.append(Spacer(1, 20))
    
    # Summary section
    story.append(Paragraph("Interview Summary", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    summary_data = [
        ['Candidate', report_data['candidate_name']],
        ['Role', report_data['role']],
        ['Average Score', f"{report_data['average_score']}/10"],
        ['Total Questions', str(len(report_data['answers']))],
        ['Overall Performance', report_data['potential'].title()]
    ]
    
    summary_table = Table(summary_data, colWidths=[100, 300])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Overall feedback
    story.append(Paragraph("Overall Assessment", styles['Heading2']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(report_data['overall_feedback'], styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Strengths and improvements
    col1 = [Paragraph("Strengths", styles['Heading3'])]
    for strength in report_data['strengths']:
        col1.append(Paragraph(f"• {strength}", styles['Normal']))
    
    col2 = [Paragraph("Areas for Improvement", styles['Heading3'])]
    for area in report_data['areas_for_improvement']:
        col2.append(Paragraph(f"• {area}", styles['Normal']))
    
    feedback_data = [[col1, col2]]
    feedback_table = Table(feedback_data, colWidths=[250, 250])
    story.append(feedback_table)
    story.append(Spacer(1, 20))
    
    # Detailed answers
    story.append(Paragraph("Detailed Answers", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    for i, answer in enumerate(report_data['answers']):
        story.append(Paragraph(f"Question {i+1}: {answer['question']}", styles['Heading3']))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Answer: {answer['answer']}", styles['Normal']))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Score: {answer['score']}/10", styles['Normal']))
        story.append(Spacer(1, 6))
        story.append(Paragraph(f"Feedback: {answer['feedback']}", styles['Normal']))
        story.append(Spacer(1, 15))
    
    # Recommendations
    story.append(Paragraph("Recommendations", styles['Heading2']))
    story.append(Spacer(1, 12))
    for rec in report_data['recommendations']:
        story.append(Paragraph(f"• {rec}", styles['Normal']))
    
    doc.build(story)
    return path 