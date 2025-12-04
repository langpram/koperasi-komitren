"use client";

import React, { RefObject } from "react";

interface CartItem {
  namaProduk: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}

interface ReceiptData {
  cabang: string;
  items: CartItem[];
  user: string;
  timestamp: Date;
  noStruk: string;
}

interface Props {
  receiptData: ReceiptData;
  receiptRef: RefObject<HTMLDivElement | null>;
  tujuanCustomer?: string;
  onPrint: () => void;
  onClose: () => void;
}

export default function Receipt({ receiptData, receiptRef, tujuanCustomer, onPrint, onClose }: Props) {
  const total = receiptData.items.reduce((acc, i) => acc + i.jumlah * i.hargaSatuan, 0);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
        <div ref={receiptRef} className="bg-white">
          <style dangerouslySetInnerHTML={{__html: `
            /* Screen Preview Styles - Supaya keliatan di layar */
            .print-area {
              color: #000;
            }
            .print-header, .print-title, .print-branch, .print-meta,
            .print-item-name, .print-item-details, .print-item-price,
            .print-total-items, .print-grand-total-label, .print-grand-total-amount,
            .print-officer, .print-thanks {
              color: #000 !important;
            }
            .print-tagline {
              color: #666 !important;
            }
            
            @media print {
              @page {
                size: A5 portrait;
                margin: 15mm;
              }
              body * {
                visibility: hidden;
              }
              .print-area, .print-area * {
                visibility: visible;
              }
              .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-width: 120mm;
                font-family: 'Arial', sans-serif;
              }
              .no-print {
                display: none !important;
              }
              
              /* Print Styles */
              .print-header {
                text-align: center;
                margin-bottom: 15px;
                padding-bottom: 12px;
                border-bottom: 2.5px solid #000;
              }
              .print-title {
                font-size: 28px;
                font-weight: 900;
                letter-spacing: 2px;
                margin-bottom: 4px;
                color: #000;
              }
              .print-branch {
                font-size: 14px;
                font-weight: 700;
                color: #000;
                margin-bottom: 10px;
              }
              .print-meta {
                font-size: 10px;
                line-height: 1.4;
                color: #000;
              }
              .print-item {
                margin-bottom: 12px;
                page-break-inside: avoid;
              }
              .print-item-name {
                font-size: 13px;
                font-weight: 700;
                color: #000;
                margin-bottom: 3px;
              }
              .print-item-details {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #333;
              }
              .print-item-price {
                font-weight: 700;
                color: #000;
              }
              .print-total-section {
                margin-top: 15px;
                padding-top: 12px;
                border-top: 2.5px solid #000;
              }
              .print-total-items {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 10px;
                font-weight: 600;
              }
              .print-grand-total {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f0f0f0;
                padding: 12px 15px;
                border-radius: 8px;
                margin: 10px 0;
              }
              .print-grand-total-label {
                font-size: 16px;
                font-weight: 900;
                color: #000;
              }
              .print-grand-total-amount {
                font-size: 18px;
                font-weight: 900;
                color: #000;
              }
              .print-footer {
                text-align: center;
                margin-top: 15px;
                padding-top: 12px;
                border-top: 2px dashed #666;
              }
              .print-officer {
                font-size: 10px;
                margin-bottom: 10px;
                color: #000;
              }
              .print-thanks {
                font-size: 14px;
                font-weight: 700;
                color: #000;
                margin-bottom: 3px;
              }
              .print-tagline {
                font-size: 9px;
                color: #666;
              }
            }
          `}} />
          
          <div className="print-area">
            {/* Header */}
            <div className="print-header">
              <div className="print-title">KOPERASI</div>
              <div className="print-branch">{receiptData.cabang}</div>
              <div className="print-meta">
                <div style={{fontWeight: 700, fontSize: '11px', marginBottom: '5px'}}>OUTPUT BARANG</div>
                <div>No. {receiptData.noStruk}</div>
                <div>{new Date(receiptData.timestamp).toLocaleString("id-ID", { 
                  day: "2-digit", 
                  month: "short", 
                  year: "numeric", 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}</div>
                {tujuanCustomer && (
                  <div style={{marginTop: '6px', fontWeight: 700}}>Tujuan: {tujuanCustomer}</div>
                )}
              </div>
            </div>

            {/* Items */}
            <div style={{marginTop: '12px'}}>
              {receiptData.items.map((item, idx) => (
                <div key={idx} className="print-item">
                  <div className="print-item-name">{item.namaProduk}</div>
                  <div className="print-item-details">
                    <span>{item.jumlah} {item.satuan} × Rp {item.hargaSatuan.toLocaleString("id-ID")}</span>
                    <span className="print-item-price">Rp {(item.jumlah * item.hargaSatuan).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Section */}
            <div className="print-total-section">
              <div className="print-total-items">
                <span>Total Item:</span>
                <span>{receiptData.items.length} item</span>
              </div>
              <div className="print-grand-total">
                <span className="print-grand-total-label">TOTAL</span>
                <span className="print-grand-total-amount">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="print-footer">
              <div className="print-officer">Petugas: {receiptData.user}</div>
              <div className="print-thanks">Terima Kasih!</div>
              <div className="print-tagline">Semoga bermanfaat</div>
            </div>
          </div>
        </div>

        {/* Preview di Card - Clean & Modern */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 no-print">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-black mb-1">KOPERASI</h2>
            <p className="text-sm font-bold text-black">{receiptData.cabang}</p>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mt-2"></div>
          </div>

          <div className="space-y-3 text-sm text-black">
            <div className="flex justify-between">
              <span className="text-black font-semibold">No. Struk</span>
              <span className="font-bold">{receiptData.noStruk}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black font-semibold">Total Item</span>
              <span className="font-bold">{receiptData.items.length} item</span>
            </div>
            <div className="flex justify-between items-center bg-white rounded-xl p-3 shadow-sm">
              <span className="font-bold text-base">TOTAL</span>
              <span className="font-black text-lg text-blue-600">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 no-print">
          <button 
            onClick={onPrint} 
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            🖨️ Print Struk
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}