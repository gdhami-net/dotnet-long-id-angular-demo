import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { parseWithExactIds } from './parse-ids';

interface RawOrder { id: number; customer: string; total: number; }
interface Order { id: string; customer: string; total: number; }

interface Row {
  name: string;
  sentByServer: string;
  shown: string;
  type: string;
  lookup: string;
  put: string;
}

// Status of a request, as text the e2e test can read off the page.
async function status(call: Promise<unknown>): Promise<string> {
  try {
    await call;
    return '200';
  } catch (e) {
    return e instanceof HttpErrorResponse ? `${e.status}` : 'error';
  }
}

@Component({
  selector: 'app-root',
  template: `
    <h1>A long ID, server to Angular and back</h1>
    <table>
      <tr><th>case</th><th>server sent</th><th>page has</th><th>type</th><th>GET by id</th><th>PUT</th></tr>
      @for (r of rows(); track r.name) {
        <tr [attr.data-case]="r.name">
          <td>{{ r.name }}</td>
          <td data-sent>{{ r.sentByServer }}</td>
          <td data-shown>{{ r.shown }}</td>
          <td data-type>{{ r.type }}</td>
          <td data-lookup>{{ r.lookup }}</td>
          <td data-put>{{ r.put }}</td>
        </tr>
      }
    </table>
  `,
  styles: `table { border-collapse: collapse; font: 14px monospace; } td, th { padding: 4px 10px; text-align: left; }`,
})
export class App implements OnInit {
  private http = inject(HttpClient);
  rows = signal<Row[]>([]);

  async ngOnInit() {
    const sent = '1234567890123456789';
    const rows: Row[] = [];

    // 1. As is: HttpClient parses the JSON number into a double.
    const raw = await firstValueFrom(this.http.get<RawOrder[]>('/raw/orders'));
    const r = raw[0];
    rows.push({
      name: 'as-is',
      sentByServer: sent,
      shown: `${r.id}`,
      type: typeof r.id,
      lookup: await status(firstValueFrom(this.http.get(`/raw/orders/${r.id}`))),
      put: await status(firstValueFrom(this.http.put('/raw/orders', r))),
    });

    // 2. Fixed on the server: the ID arrives as a string.
    const fixed = await firstValueFrom(this.http.get<Order[]>('/orders'));
    const f = fixed[0];
    rows.push({
      name: 'string-id',
      sentByServer: sent,
      shown: f.id,
      type: typeof f.id,
      lookup: await status(firstValueFrom(this.http.get(`/orders/${f.id}`))),
      put: await status(firstValueFrom(this.http.put('/orders', f))),
    });

    // 3. API unchanged: read the text, parse the IDs from their source text.
    const text = await firstValueFrom(this.http.get('/raw/orders', { responseType: 'text' }));
    const s = (parseWithExactIds(text) as Order[])[0];
    rows.push({
      name: 'source-text',
      sentByServer: sent,
      shown: s.id,
      type: typeof s.id,
      lookup: await status(firstValueFrom(this.http.get(`/raw/orders/${s.id}`))),
      put: await status(firstValueFrom(this.http.put('/raw/orders', s))),
    });

    this.rows.set(rows);
  }
}
