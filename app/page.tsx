"use client"

import { useState } from "react"

const CURRENCIES = {
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  LKR: { symbol: "Rs.", code: "LKR", name: "Sri Lankan Rupee" },
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
  GBP: { symbol: "£", code: "GBP", name: "British Pound" },
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  AUD: { symbol: "A$", code: "AUD", name: "Australian Dollar" },
  CAD: { symbol: "C$", code: "CAD", name: "Canadian Dollar" },
  JPY: { symbol: "¥", code: "JPY", name: "Japanese Yen" },
}

export default function LeachingCalculator() {
  const [totalAmount, setTotalAmount] = useState("")
  const [years, setYears] = useState("")
  const [rate, setRate] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [result, setResult] = useState<{
    monthly: number
    total: number
    interest: number
  } | null>(null)
  const [error, setError] = useState("")

  const generateAmortizationSchedule = () => {
    const P = Number.parseFloat(totalAmount)
    const y = Number.parseFloat(years)
    const r = Number.parseFloat(rate) / 100
    const monthlyRate = r / 12
    const numerator = P * monthlyRate
    const denominator = 1 - Math.pow(1 + monthlyRate, -12 * y)
    const monthlyPayment = numerator / denominator

    const schedule = []
    let balance = P

    for (let month = 1; month <= 12 * y; month++) {
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: Math.max(0, principalPayment),
        interest: interestPayment,
        balance: Math.max(0, balance),
      })
    }

    return schedule
  }

  const calculateLeaching = () => {
    setError("")
    setResult(null)

    // Validation
    if (!totalAmount || !years || !rate) {
      setError("Please fill in all fields")
      return
    }

    const P = Number.parseFloat(totalAmount)
    const y = Number.parseFloat(years)
    const r = Number.parseFloat(rate) / 100

    if (P <= 0 || y <= 0 || r < 0) {
      setError("Please enter valid positive numbers")
      return
    }

    if (r === 0) {
      setError("Annual Percentage Rate cannot be 0%")
      return
    }

    try {
      // Formula: M = P * (r/12) / (1 - (1 + r/12)^(-12*y))
      const monthlyRate = r / 12
      const numerator = P * monthlyRate
      const denominator = 1 - Math.pow(1 + monthlyRate, -12 * y)
      const monthlyPayment = numerator / denominator

      const totalPayment = monthlyPayment * 12 * y
      const totalInterest = totalPayment - P

      setResult({
        monthly: monthlyPayment,
        total: totalPayment,
        interest: totalInterest,
      })
    } catch (err) {
      setError("Calculation error. Please check your inputs.")
    }
  }

  const handleReset = () => {
    setTotalAmount("")
    setYears("")
    setRate("")
    setResult(null)
    setError("")
  }

  const handleExportPDF = () => {
    if (!result) return

    const schedule = generateAmortizationSchedule()
    const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES]
    let tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px;">
        <thead>
          <tr style="background-color: #1e40af; color: white;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Month</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Payment</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Principal</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Interest</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Balance</th>
          </tr>
        </thead>
        <tbody>
    `

    schedule.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? "#f9fafb" : "#ffffff"
      tableHTML += `
        <tr style="background-color: ${bgColor};">
          <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${row.month}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencyInfo.symbol}${row.payment.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencyInfo.symbol}${row.principal.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencyInfo.symbol}${row.interest.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencyInfo.symbol}${row.balance.toFixed(2)}</td>
        </tr>
      `
    })

    tableHTML += `
        </tbody>
      </table>
    `

    const content = `
      <html>
        <head>
          <title>Leaching Calculator Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 20px; font-size: 14px; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .summary-item { flex: 1; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #1e40af; }
            .summary-item p { margin: 5px 0; font-size: 12px; }
            .summary-item .value { font-size: 18px; font-weight: bold; color: #1e40af; }
            .details { font-size: 12px; margin: 15px 0; }
            .details p { margin: 5px 0; }
            .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Monthly Leaching Amount Calculator Report</h1>
          
          <div class="details">
            <p><strong>Currency:</strong> ${currencyInfo.name} (${currencyInfo.code})</p>
            <p><strong>Total Amount:</strong> ${currencyInfo.symbol}${Number.parseFloat(totalAmount).toFixed(2)}</p>
            <p><strong>Number of Years:</strong> ${years}</p>
            <p><strong>Annual Percentage Rate:</strong> ${rate}%</p>
          </div>

          <h2>Summary</h2>
          <div class="summary">
            <div class="summary-item">
              <p>Monthly Payment</p>
              <div class="value">${currencyInfo.symbol}${result.monthly.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <p>Total Payment</p>
              <div class="value">${currencyInfo.symbol}${result.total.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <p>Total Interest</p>
              <div class="value">${currencyInfo.symbol}${result.interest.toFixed(2)}</div>
            </div>
          </div>

          <h2>Amortization Schedule</h2>
          ${tableHTML}

          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>This report was generated by the Monthly Leaching Amount Calculator</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "", "width=900,height=700")
    if (printWindow) {
      printWindow.document.write(content)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const currencyInfo = CURRENCIES[currency as keyof typeof CURRENCIES]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-2">Leaching Calculator</h1>
          <p className="text-base md:text-lg text-slate-600">
            Calculate your monthly installment payments with precision
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          {/* Input Section */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base bg-white"
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.symbol} {info.code} - {info.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Total Amount ({currencyInfo.code})
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Enter total amount"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Years</label>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  placeholder="Enter years"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Annual Percentage Rate (%)</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Enter APR"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-base"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-700 font-medium text-sm md:text-base">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <button
              onClick={calculateLeaching}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-base"
            >
              Calculate
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors text-base"
            >
              Reset
            </button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
                  <p className="text-xs md:text-sm text-blue-600 font-semibold mb-1">Monthly Payment</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-900">
                    {currencyInfo.symbol}
                    {result.monthly.toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200">
                  <p className="text-xs md:text-sm text-green-600 font-semibold mb-1">Total Payment</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-900">
                    {currencyInfo.symbol}
                    {result.total.toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border-2 border-orange-200">
                  <p className="text-xs md:text-sm text-orange-600 font-semibold mb-1">Total Interest</p>
                  <p className="text-2xl md:text-3xl font-bold text-orange-900">
                    {currencyInfo.symbol}
                    {result.interest.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportPDF}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-colors mt-6 text-base"
              >
                📄 Export as PDF
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2 text-base md:text-lg">How it works:</h3>
          <p className="text-blue-800 text-sm md:text-base">
            This calculator uses the standard amortization formula to compute monthly installment payments. Enter your
            total loan amount, loan term in years, and annual interest rate to get your monthly payment, total amount
            paid, and total interest charged.
          </p>
        </div>
      </div>
    </div>
  )
}
