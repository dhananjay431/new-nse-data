# Option Chain Analysis Page Implementation Plan

## Goal
Create a new page named **Option Chain Analysis** that allows the user to select an index symbol, fetch option-chain contract information, fetch option-chain data by expiry, display the data in a table, and show useful option-chain analysis charts.

---

## 1. Create New Page

Create a new page/component:

```txt
Option Chain Analysis
```

Suggested route:

```txt
/option-chain-analysis
```

Suggested files:

```txt
src/app/pages/option-chain-analysis/
  option-chain-analysis.component.ts
  option-chain-analysis.component.html
  option-chain-analysis.component.scss
```

---

## 2. Add Dropdown

Add the following dropdown in the page HTML:

```html
<label id="equityOptionchainLbl" for="equity_optionchain_select">
  Select Index
</label>

<select
  name=""
  id="equity_optionchain_select"
  aria-labelledby="equityOptionchainLbl"
  [(ngModel)]="selectedSymbol"
  (change)="onSymbolChange()"
>
  <option value="" id="select">Select</option>
  <option value="NIFTY" selected data-nse-translate="symbol" data-nse-translate-symbol="NIFTY">NIFTY</option>
  <option value="NIFTYNXT50" data-nse-translate="symbol" data-nse-translate-symbol="NIFTYNXT50" class="niftynxt">NIFTYNXT50</option>
  <option value="FINNIFTY" data-nse-translate="symbol" data-nse-translate-symbol="FINNIFTY">FINNIFTY</option>
  <option value="BANKNIFTY" data-nse-translate="symbol" data-nse-translate-symbol="BANKNIFTY">BANKNIFTY</option>
  <option value="MIDCPNIFTY" data-nse-translate="symbol" data-nse-translate-symbol="MIDCPNIFTY">MIDCPNIFTY</option>
</select>
```

Default selected value:

```ts
selectedSymbol = 'NIFTY';
```

---

## 3. API 1: Get Option Chain Contract Info

When dropdown value changes, call this API:

```txt
api/option-chain-contract-info?symbol=SELECTED_SYMBOL
```

Example:

```txt
api/option-chain-contract-info?symbol=NIFTY
```

Purpose:

- Get available expiry dates.
- Get contract-related metadata.
- Set default expiry date.

Expected flow:

```ts
onSymbolChange() {
  this.getContractInfo(this.selectedSymbol);
}
```

Service method:

```ts
getContractInfo(symbol: string) {
  return this.http.get<any>(`api/option-chain-contract-info?symbol=${symbol}`);
}
```

After response:

```ts
this.expiryDates = response.expiryDates || [];
this.selectedExpiry = this.expiryDates[0];
this.getOptionChainData();
```

---

## 4. API 2: Get Option Chain Data

Call this API after selecting symbol and expiry:

```txt
api/option-chain-v3?type=Indices&symbol=NIFTY&expiry=19-May-2026
```

Dynamic format:

```txt
api/option-chain-v3?type=Indices&symbol=SELECTED_SYMBOL&expiry=SELECTED_EXPIRY
```

Example:

```ts
getOptionChainData() {
  const url = `api/option-chain-v3?type=Indices&symbol=${this.selectedSymbol}&expiry=${this.selectedExpiry}`;
  return this.http.get<any>(url).subscribe({
    next: (response) => {
      this.optionChainData = response.records?.data || response.data || [];
      this.prepareTableData();
      this.prepareCharts();
    },
    error: (error) => {
      console.error('Option chain API error', error);
    }
  });
}
```

---

## 5. Add Expiry Dropdown

Add expiry dropdown after contract info API response:

```html
<label for="expiry_select">Select Expiry</label>

<select
  id="expiry_select"
  [(ngModel)]="selectedExpiry"
  (change)="getOptionChainData()"
>
  <option *ngFor="let expiry of expiryDates" [value]="expiry">
    {{ expiry }}
  </option>
</select>
```

---

## 6. Show Data in Table

Table columns should compare CE and PE side-by-side.

Recommended columns:

```txt
CALL OI
CALL Change OI
CALL Volume
CALL IV
CALL LTP
Strike Price
PUT LTP
PUT IV
PUT Volume
PUT Change OI
PUT OI
```

HTML table example:

```html
<table class="option-chain-table">
  <thead>
    <tr>
      <th colspan="5">CALLS</th>
      <th>Strike</th>
      <th colspan="5">PUTS</th>
    </tr>
    <tr>
      <th>OI</th>
      <th>Chg OI</th>
      <th>Volume</th>
      <th>IV</th>
      <th>LTP</th>
      <th>Strike</th>
      <th>LTP</th>
      <th>IV</th>
      <th>Volume</th>
      <th>Chg OI</th>
      <th>OI</th>
    </tr>
  </thead>

  <tbody>
    <tr *ngFor="let row of tableData">
      <td>{{ row.callOI }}</td>
      <td>{{ row.callChangeOI }}</td>
      <td>{{ row.callVolume }}</td>
      <td>{{ row.callIV }}</td>
      <td>{{ row.callLTP }}</td>
      <td class="strike">{{ row.strikePrice }}</td>
      <td>{{ row.putLTP }}</td>
      <td>{{ row.putIV }}</td>
      <td>{{ row.putVolume }}</td>
      <td>{{ row.putChangeOI }}</td>
      <td>{{ row.putOI }}</td>
    </tr>
  </tbody>
</table>
```

Prepare table data:

```ts
prepareTableData() {
  this.tableData = this.optionChainData.map((item: any) => ({
    strikePrice: item.strikePrice,

    callOI: item.CE?.openInterest || 0,
    callChangeOI: item.CE?.changeinOpenInterest || 0,
    callVolume: item.CE?.totalTradedVolume || 0,
    callIV: item.CE?.impliedVolatility || 0,
    callLTP: item.CE?.lastPrice || 0,

    putOI: item.PE?.openInterest || 0,
    putChangeOI: item.PE?.changeinOpenInterest || 0,
    putVolume: item.PE?.totalTradedVolume || 0,
    putIV: item.PE?.impliedVolatility || 0,
    putLTP: item.PE?.lastPrice || 0,
  }));
}
```

---

## 7. Add Option Chain Analysis Summary Cards

Add cards above the table:

```txt
Spot Price
Max Pain
PCR
Total Call OI
Total Put OI
Highest Call OI Strike
Highest Put OI Strike
Highest Call Volume Strike
Highest Put Volume Strike
```

Example calculation:

```ts
prepareSummary() {
  const totalCallOI = this.tableData.reduce((sum, row) => sum + row.callOI, 0);
  const totalPutOI = this.tableData.reduce((sum, row) => sum + row.putOI, 0);

  this.summary = {
    totalCallOI,
    totalPutOI,
    pcr: totalCallOI ? (totalPutOI / totalCallOI).toFixed(2) : 0,
    highestCallOI: this.getHighestStrike('callOI'),
    highestPutOI: this.getHighestStrike('putOI'),
    highestCallVolume: this.getHighestStrike('callVolume'),
    highestPutVolume: this.getHighestStrike('putVolume'),
  };
}

getHighestStrike(key: string) {
  return this.tableData.reduce((max, row) => row[key] > max[key] ? row : max, this.tableData[0]);
}
```

---

## 8. Add Option Chain Analysis Charts

Recommended charts:

### Chart 1: Open Interest by Strike

Purpose:

- Compare Call OI and Put OI.
- Identify support and resistance zones.

Chart data:

```ts
openInterestChartData = this.tableData.map(row => ({
  strikePrice: row.strikePrice,
  callOI: row.callOI,
  putOI: row.putOI,
}));
```

Recommended chart type:

```txt
Bar Chart
```

---

### Chart 2: Change in Open Interest

Purpose:

- Show fresh call writing and put writing.
- Useful for intraday sentiment.

Chart data:

```ts
changeOIChartData = this.tableData.map(row => ({
  strikePrice: row.strikePrice,
  callChangeOI: row.callChangeOI,
  putChangeOI: row.putChangeOI,
}));
```

Recommended chart type:

```txt
Bar Chart
```

---

### Chart 3: Volume by Strike

Purpose:

- Find active trading strikes.
- Identify where traders are participating most.

Chart data:

```ts
volumeChartData = this.tableData.map(row => ({
  strikePrice: row.strikePrice,
  callVolume: row.callVolume,
  putVolume: row.putVolume,
}));
```

Recommended chart type:

```txt
Bar Chart
```

---

### Chart 4: PCR Trend

Purpose:

- Show put-call ratio sentiment.
- PCR above 1 means put OI is higher than call OI.
- PCR below 1 means call OI is higher than put OI.

Chart data:

```ts
pcrChartData = this.tableData.map(row => ({
  strikePrice: row.strikePrice,
  pcr: row.callOI ? row.putOI / row.callOI : 0,
}));
```

Recommended chart type:

```txt
Line Chart
```

---

## 9. Suggested Angular Component Code

```ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-option-chain-analysis',
  templateUrl: './option-chain-analysis.component.html',
  styleUrls: ['./option-chain-analysis.component.scss']
})
export class OptionChainAnalysisComponent implements OnInit {
  selectedSymbol = 'NIFTY';
  selectedExpiry = '';

  expiryDates: string[] = [];
  optionChainData: any[] = [];
  tableData: any[] = [];
  summary: any = {};

  openInterestChartData: any[] = [];
  changeOIChartData: any[] = [];
  volumeChartData: any[] = [];
  pcrChartData: any[] = [];

  loading = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getContractInfo(this.selectedSymbol);
  }

  onSymbolChange() {
    if (!this.selectedSymbol) return;
    this.getContractInfo(this.selectedSymbol);
  }

  getContractInfo(symbol: string) {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(`api/option-chain-contract-info?symbol=${symbol}`).subscribe({
      next: (response) => {
        this.expiryDates = response.expiryDates || response.data?.expiryDates || [];
        this.selectedExpiry = this.expiryDates[0] || '';

        if (this.selectedExpiry) {
          this.getOptionChainData();
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load contract information.';
      }
    });
  }

  getOptionChainData() {
    if (!this.selectedSymbol || !this.selectedExpiry) return;

    this.loading = true;
    this.errorMessage = '';

    const url = `api/option-chain-v3?type=Indices&symbol=${this.selectedSymbol}&expiry=${this.selectedExpiry}`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.optionChainData = response.records?.data || response.data || [];
        this.prepareTableData();
        this.prepareSummary();
        this.prepareCharts();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load option chain data.';
      }
    });
  }

  prepareTableData() {
    this.tableData = this.optionChainData.map((item: any) => ({
      strikePrice: item.strikePrice,

      callOI: item.CE?.openInterest || 0,
      callChangeOI: item.CE?.changeinOpenInterest || 0,
      callVolume: item.CE?.totalTradedVolume || 0,
      callIV: item.CE?.impliedVolatility || 0,
      callLTP: item.CE?.lastPrice || 0,

      putOI: item.PE?.openInterest || 0,
      putChangeOI: item.PE?.changeinOpenInterest || 0,
      putVolume: item.PE?.totalTradedVolume || 0,
      putIV: item.PE?.impliedVolatility || 0,
      putLTP: item.PE?.lastPrice || 0,
    }));
  }

  prepareSummary() {
    const totalCallOI = this.tableData.reduce((sum, row) => sum + row.callOI, 0);
    const totalPutOI = this.tableData.reduce((sum, row) => sum + row.putOI, 0);

    this.summary = {
      totalCallOI,
      totalPutOI,
      pcr: totalCallOI ? Number((totalPutOI / totalCallOI).toFixed(2)) : 0,
      highestCallOI: this.getHighestStrike('callOI'),
      highestPutOI: this.getHighestStrike('putOI'),
      highestCallVolume: this.getHighestStrike('callVolume'),
      highestPutVolume: this.getHighestStrike('putVolume'),
    };
  }

  getHighestStrike(key: string) {
    if (!this.tableData.length) return null;
    return this.tableData.reduce((max, row) => row[key] > max[key] ? row : max, this.tableData[0]);
  }

  prepareCharts() {
    this.openInterestChartData = this.tableData.map(row => ({
      strikePrice: row.strikePrice,
      callOI: row.callOI,
      putOI: row.putOI,
    }));

    this.changeOIChartData = this.tableData.map(row => ({
      strikePrice: row.strikePrice,
      callChangeOI: row.callChangeOI,
      putChangeOI: row.putChangeOI,
    }));

    this.volumeChartData = this.tableData.map(row => ({
      strikePrice: row.strikePrice,
      callVolume: row.callVolume,
      putVolume: row.putVolume,
    }));

    this.pcrChartData = this.tableData.map(row => ({
      strikePrice: row.strikePrice,
      pcr: row.callOI ? Number((row.putOI / row.callOI).toFixed(2)) : 0,
    }));
  }
}
```

---

## 10. Suggested UI Layout

```txt
Option Chain Analysis Page

[Symbol Dropdown] [Expiry Dropdown] [Refresh Button]

Summary Cards:
[Spot Price] [PCR] [Total Call OI] [Total Put OI]
[Highest Call OI Strike] [Highest Put OI Strike]

Charts:
[Open Interest Chart]
[Change in OI Chart]
[Volume Chart]
[PCR Line Chart]

Table:
CALLS | Strike | PUTS
```

---

## 11. Styling Suggestions

```scss
.option-chain-page {
  padding: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 16px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.option-chain-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.option-chain-table th,
.option-chain-table td {
  border: 1px solid #e5e7eb;
  padding: 8px;
  text-align: right;
}

.option-chain-table th {
  background: #f3f4f6;
  font-weight: 600;
}

.option-chain-table .strike {
  font-weight: 700;
  text-align: center;
  background: #fef3c7;
}
```

---

## 12. Important Notes

- Always URL encode expiry value before passing it to API.
- Show loader while API is loading.
- Show error message if API fails.
- Add refresh button for manual reload.
- Add sorting or filtering around ATM strike if data is large.
- Highlight ATM strike row if spot price is available.
- Use chart library like ApexCharts, Chart.js, Highcharts, or ngx-charts.

Example URL encoding:

```ts
const expiry = encodeURIComponent(this.selectedExpiry);
const url = `api/option-chain-v3?type=Indices&symbol=${this.selectedSymbol}&expiry=${expiry}`;
```

---

## 13. Final Flow

```txt
Page Load
  ↓
Default selectedSymbol = NIFTY
  ↓
Call api/option-chain-contract-info?symbol=NIFTY
  ↓
Get expiry list
  ↓
Set selectedExpiry = first expiry
  ↓
Call api/option-chain-v3?type=Indices&symbol=NIFTY&expiry=selectedExpiry
  ↓
Prepare table data
  ↓
Prepare summary cards
  ↓
Prepare charts
  ↓
Display option chain analysis
```
