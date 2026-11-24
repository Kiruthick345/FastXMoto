"""
FastXMoto - Python Backend Server with Live Excel Sheet Database Sync
Serves static dealership assets and syncs all vehicle and repair data
directly to/from 'FastXMoto_Database.xlsx' using openpyxl.
"""

import os
import json
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

PORT = 8080
DATABASE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'FastXMoto_Database.xlsx')

def ensure_excel_database_exists():
    """Ensure FastXMoto_Database.xlsx exists with proper sheet schema and styling"""
    if os.path.exists(DATABASE_FILE):
        return

    wb = openpyxl.Workbook()
    
    # Sheet 1: Vehicles_Master
    ws1 = wb.active
    ws1.title = 'Vehicles_Master'
    headers_v = [
        'ID', 'Registration_Number', 'Brand', 'Model', 'Year', 'Engine_CC',
        'Purchase_Date', 'Purchase_Price', 'Seller_Name', 'Seller_Phone',
        'Workshop_Total_Cost', 'Total_Cost_Basis', 'Status',
        'Selling_Price', 'Sale_Date', 'Buyer_Name', 'Buyer_Phone',
        'Net_Profit', 'Created_At'
    ]
    ws1.append(headers_v)
    _style_header_row(ws1, '1E293B', 'F8FAFC')

    # Sheet 2: Workshop_Repairs
    ws2 = wb.create_sheet(title='Workshop_Repairs')
    headers_r = [
        'Repair_ID', 'Registration_Number', 'Vehicle_Name',
        'Repair_Description', 'Repair_Cost', 'Repair_Date'
    ]
    ws2.append(headers_r)
    _style_header_row(ws2, '581C87', 'FAF5FF')

    wb.save(DATABASE_FILE)
    print(f"Initialized blank Excel database at {DATABASE_FILE}")

def _style_header_row(ws, bg_hex, text_hex):
    fill = PatternFill(start_color=bg_hex, end_color=bg_hex, fill_type='solid')
    font = Font(name='Calibri', size=11, bold=True, color=text_hex)
    alignment = Alignment(horizontal='center', vertical='center')
    for cell in ws[1]:
        cell.fill = fill
        cell.font = font
        cell.alignment = alignment
    ws.row_dimensions[1].height = 26

def read_database_from_excel():
    """Read all vehicle records and workshop repairs from FastXMoto_Database.xlsx"""
    ensure_excel_database_exists()
    try:
        wb = openpyxl.load_workbook(DATABASE_FILE, data_only=True)
    except Exception as e:
        print(f"Error loading {DATABASE_FILE}: {e}")
        return []

    # 1. Read Workshop Repairs
    repairs_by_reg = {}
    if 'Workshop_Repairs' in wb.sheetnames:
        ws_r = wb['Workshop_Repairs']
        for row in ws_r.iter_rows(min_row=2, values_only=True):
            if not row or not any(row):
                continue
            repair_id = str(row[0] or '')
            reg_num = str(row[1] or '').strip().upper()
            clean_reg = reg_num.replace(' ', '').replace('-', '')
            desc = str(row[3] or '') if len(row) > 3 else ''
            try:
                cost = float(row[4]) if len(row) > 4 and row[4] is not None else 0.0
            except (ValueError, TypeError):
                cost = 0.0
            date_str = str(row[5] or '') if len(row) > 5 else ''

            if clean_reg not in repairs_by_reg:
                repairs_by_reg[clean_reg] = []
            
            repairs_by_reg[clean_reg].append({
                'id': repair_id or f"ref-{len(repairs_by_reg[clean_reg]) + 1}",
                'description': desc,
                'cost': cost,
                'date': date_str
            })

    # 2. Read Vehicles Master
    bikes = []
    if 'Vehicles_Master' in wb.sheetnames:
        ws_v = wb['Vehicles_Master']
        for row in ws_v.iter_rows(min_row=2, values_only=True):
            if not row or not any(row):
                continue
            
            b_id = str(row[0] or '')
            reg_num = str(row[1] or '').strip().upper()
            clean_reg = reg_num.replace(' ', '').replace('-', '')
            brand = str(row[2] or '')
            model = str(row[3] or '')
            
            try:
                year = int(row[4]) if len(row) > 4 and row[4] is not None else 2023
            except (ValueError, TypeError):
                year = 2023

            try:
                engine_cc = int(row[5]) if len(row) > 5 and row[5] is not None else None
            except (ValueError, TypeError):
                engine_cc = None

            purchase_date = str(row[6] or '') if len(row) > 6 else ''
            
            try:
                purchase_price = float(row[7]) if len(row) > 7 and row[7] is not None else 0.0
            except (ValueError, TypeError):
                purchase_price = 0.0

            seller_name = str(row[8] or '') if len(row) > 8 else ''
            seller_phone = str(row[9] or '') if len(row) > 9 else ''
            status = str(row[12] or 'In Stock') if len(row) > 12 else 'In Stock'
            
            try:
                selling_price = float(row[13]) if len(row) > 13 and row[13] is not None else 0.0
            except (ValueError, TypeError):
                selling_price = 0.0

            sale_date = str(row[14] or '') if len(row) > 14 else ''
            buyer_name = str(row[15] or '') if len(row) > 15 else ''
            buyer_phone = str(row[16] or '') if len(row) > 16 else ''
            created_at = str(row[18] or '') if len(row) > 18 else ''

            refurb_list = repairs_by_reg.get(clean_reg, [])

            bikes.append({
                'id': b_id or f"BIKE-{len(bikes) + 1}",
                'regNumber': reg_num,
                'brand': brand,
                'model': model,
                'variant': '',
                'year': year,
                'engineCC': engine_cc,
                'purchaseDate': purchase_date,
                'purchasePrice': purchase_price,
                'sellerName': seller_name,
                'sellerPhone': seller_phone,
                'status': status,
                'sellingPrice': selling_price,
                'saleDate': sale_date,
                'buyerName': buyer_name,
                'buyerPhone': buyer_phone,
                'refurbishments': refurb_list,
                'documents': {'rcBook': False, 'insurance': False, 'puc': False},
                'createdAt': created_at
            })

    return bikes

def save_database_to_excel(bikes):
    """Save all vehicles and repairs to FastXMoto_Database.xlsx with formatting"""
    wb = openpyxl.Workbook()

    # Border style
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # 1. Vehicles_Master Sheet
    ws1 = wb.active
    ws1.title = 'Vehicles_Master'
    headers_v = [
        'ID', 'Registration_Number', 'Brand', 'Model', 'Year', 'Engine_CC',
        'Purchase_Date', 'Purchase_Price', 'Seller_Name', 'Seller_Phone',
        'Workshop_Total_Cost', 'Total_Cost_Basis', 'Status',
        'Selling_Price', 'Sale_Date', 'Buyer_Name', 'Buyer_Phone',
        'Net_Profit', 'Created_At'
    ]
    ws1.append(headers_v)
    _style_header_row(ws1, '1E293B', 'F8FAFC')

    all_repairs = []

    for b in bikes:
        reg = (b.get('regNumber') or '').strip().upper()
        buy_price = float(b.get('purchasePrice') or 0)
        refurb_items = b.get('refurbishments') or []
        workshop_cost = sum(float(r.get('cost') or 0) for r in refurb_items)
        cost_basis = buy_price + workshop_cost
        sell_price = float(b.get('sellingPrice') or 0)
        profit = sell_price - cost_basis if b.get('status') == 'Sold' else 0.0

        row_v = [
            b.get('id', ''),
            reg,
            b.get('brand', ''),
            b.get('model', ''),
            b.get('year', ''),
            b.get('engineCC') or '',
            b.get('purchaseDate', ''),
            buy_price,
            b.get('sellerName', ''),
            b.get('sellerPhone', ''),
            workshop_cost,
            cost_basis,
            b.get('status', 'In Stock'),
            sell_price,
            b.get('saleDate', ''),
            b.get('buyerName', ''),
            b.get('buyerPhone', ''),
            profit,
            b.get('createdAt', '')
        ]
        ws1.append(row_v)

        for r in refurb_items:
            all_repairs.append({
                'repairId': r.get('id', ''),
                'regNumber': reg,
                'vehicleName': f"{b.get('brand', '')} {b.get('model', '')}".strip(),
                'description': r.get('description', ''),
                'cost': float(r.get('cost') or 0),
                'date': r.get('date', '')
            })

    # Auto-adjust column widths for Vehicles_Master
    for col in ws1.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws1.column_dimensions[col_letter].width = max(max_len + 3, 12)

    # 2. Workshop_Repairs Sheet
    ws2 = wb.create_sheet(title='Workshop_Repairs')
    headers_r = [
        'Repair_ID', 'Registration_Number', 'Vehicle_Name',
        'Repair_Description', 'Repair_Cost', 'Repair_Date'
    ]
    ws2.append(headers_r)
    _style_header_row(ws2, '581C87', 'FAF5FF')

    for r in all_repairs:
        row_r = [
            r['repairId'],
            r['regNumber'],
            r['vehicleName'],
            r['description'],
            r['cost'],
            r['date']
        ]
        ws2.append(row_r)

    # Auto-adjust column widths for Workshop_Repairs
    for col in ws2.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws2.column_dimensions[col_letter].width = max(max_len + 3, 14)

    wb.save(DATABASE_FILE)
    print(f"Saved {len(bikes)} vehicles and {len(all_repairs)} repairs to {DATABASE_FILE}")

class FastXRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable caching for API responses
        if self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/api/database' or self.path == '/api/database/':
            bikes = read_database_from_excel()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                'status': 'success',
                'source': 'FastXMoto_Database.xlsx',
                'count': len(bikes),
                'bikes': bikes
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        elif self.path == '/api/export-excel' or self.path == '/FastXMoto_Database.xlsx':
            ensure_excel_database_exists()
            if os.path.exists(DATABASE_FILE):
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                self.send_header('Content-Disposition', 'attachment; filename="FastXMoto_Database.xlsx"')
                self.send_header('Content-Length', str(os.path.getsize(DATABASE_FILE)))
                self.end_headers()
                with open(DATABASE_FILE, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_error(404, 'Database file not found')
                return

        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/database' or self.path == '/api/database/':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
                bikes = data.get('bikes', data) if isinstance(data, dict) else data
                if not isinstance(bikes, list):
                    bikes = []
                save_database_to_excel(bikes)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {
                    'status': 'success',
                    'message': 'Database updated in FastXMoto_Database.xlsx',
                    'count': len(bikes)
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode('utf-8'))
            return

        self.send_error(404, 'Endpoint not found')

def run_server():
    ensure_excel_database_exists()
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, FastXRequestHandler)
    print(f"FastXMoto Dealership Server running on http://localhost:{PORT}")
    print(f"Connected to Excel Database: {DATABASE_FILE}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
