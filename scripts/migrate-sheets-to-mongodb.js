"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var google_sheets_1 = require("../lib/google-sheets");
var dotenv_1 = require("dotenv");
// Load environment variables
dotenv_1.default.config({ path: '.env.local' });
function migrateData() {
    return __awaiter(this, void 0, void 0, function () {
        var client, db, invoicesCollection, data, headerRow, columnMap_1, documents, result, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, 9, 11]);
                    return [4 /*yield*/, client.connect()];
                case 2:
                    _b.sent();
                    console.log('Connected to MongoDB');
                    db = client.db();
                    invoicesCollection = db.collection('invoices');
                    // Get all data from Google Sheets
                    console.log('Fetching data from Google Sheets...');
                    return [4 /*yield*/, (0, google_sheets_1.getSheetData)('Sheet1!A2:Z')];
                case 3:
                    data = _b.sent();
                    if (!data) {
                        throw new Error('No data found in Google Sheets');
                    }
                    return [4 /*yield*/, (0, google_sheets_1.getSheetData)('Sheet1!1:1')];
                case 4:
                    headerRow = (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a[0];
                    if (!headerRow) {
                        throw new Error('Could not find headers in spreadsheet');
                    }
                    columnMap_1 = {
                        client: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'client'; }),
                        episodeTitle: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'episode title'; }),
                        type: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'type'; }),
                        earnedAfterFees: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === '$ after fee'; }),
                        invoicedAmount: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === '$ invoiced'; }),
                        billedMinutes: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'billed minutes'; }),
                        lengthHours: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'episode length hours'; }),
                        lengthMinutes: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'episode length minutes'; }),
                        lengthSeconds: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'episode length seconds'; }),
                        paymentMethod: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'payment method'; }),
                        editingHours: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'hours spent editing'; }),
                        editingMinutes: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'minutes spent editing'; }),
                        editingSeconds: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'seconds spent editing'; }),
                        billableHours: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'billable hours'; }),
                        runningHourlyTotal: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'running hourly total'; }),
                        ratePerMinute: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'rate per minute'; }),
                        dateInvoiced: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'date invoiced'; }),
                        datePaid: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'date paid'; }),
                        note: headerRow.findIndex(function (h) { return h.toLowerCase().trim() === 'note'; }),
                    };
                    documents = data.map(function (row) { return ({
                        client: row[columnMap_1.client] || '',
                        episodeTitle: row[columnMap_1.episodeTitle] || '',
                        type: row[columnMap_1.type] || '',
                        earnedAfterFees: parseFloat(row[columnMap_1.earnedAfterFees]) || 0,
                        invoicedAmount: parseFloat(row[columnMap_1.invoicedAmount]) || 0,
                        billedMinutes: parseInt(row[columnMap_1.billedMinutes]) || 0,
                        length: {
                            hours: parseInt(row[columnMap_1.lengthHours]) || 0,
                            minutes: parseInt(row[columnMap_1.lengthMinutes]) || 0,
                            seconds: parseInt(row[columnMap_1.lengthSeconds]) || 0,
                        },
                        paymentMethod: row[columnMap_1.paymentMethod] || '',
                        editingTime: {
                            hours: parseInt(row[columnMap_1.editingHours]) || 0,
                            minutes: parseInt(row[columnMap_1.editingMinutes]) || 0,
                            seconds: parseInt(row[columnMap_1.editingSeconds]) || 0,
                        },
                        billableHours: parseFloat(row[columnMap_1.billableHours]) || 0,
                        runningHourlyTotal: parseFloat(row[columnMap_1.runningHourlyTotal]) || 0,
                        ratePerMinute: parseFloat(row[columnMap_1.ratePerMinute]) || 0,
                        dateInvoiced: row[columnMap_1.dateInvoiced] ? new Date(row[columnMap_1.dateInvoiced]) : null,
                        datePaid: row[columnMap_1.datePaid] ? new Date(row[columnMap_1.datePaid]) : null,
                        note: row[columnMap_1.note] || '',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }); });
                    if (!(documents.length > 0)) return [3 /*break*/, 6];
                    console.log("Inserting ".concat(documents.length, " documents into MongoDB..."));
                    return [4 /*yield*/, invoicesCollection.insertMany(documents)];
                case 5:
                    result = _b.sent();
                    console.log("Successfully inserted ".concat(result.insertedCount, " documents"));
                    return [3 /*break*/, 7];
                case 6:
                    console.log('No documents to insert');
                    _b.label = 7;
                case 7: return [3 /*break*/, 11];
                case 8:
                    error_1 = _b.sent();
                    console.error('Error during migration:', error_1);
                    throw error_1;
                case 9: return [4 /*yield*/, client.close()];
                case 10:
                    _b.sent();
                    console.log('Closed MongoDB connection');
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
// Run the migration
migrateData()
    .then(function () {
    console.log('Migration completed successfully');
    process.exit(0);
})
    .catch(function (error) {
    console.error('Migration failed:', error);
    process.exit(1);
});
