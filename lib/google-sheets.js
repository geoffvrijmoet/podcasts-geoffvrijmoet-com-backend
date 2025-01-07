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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthToken = getAuthToken;
exports.getSheetData = getSheetData;
exports.updateSheetData = updateSheetData;
exports.appendSheetData = appendSheetData;
var googleapis_1 = require("googleapis");
var google_auth_library_1 = require("google-auth-library");
// These will come from your service account JSON
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var GOOGLE_PRIVATE_KEY = (_a = process.env.GOOGLE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n');
var GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
var GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
function getAuthToken() {
    return __awaiter(this, void 0, void 0, function () {
        var auth;
        return __generator(this, function (_a) {
            auth = new google_auth_library_1.JWT({
                email: GOOGLE_CLIENT_EMAIL,
                key: GOOGLE_PRIVATE_KEY,
                scopes: SCOPES,
            });
            return [2 /*return*/, auth];
        });
    });
}
// Add this function to get column indices
function getColumnIndices() {
    return __awaiter(this, void 0, void 0, function () {
        var headers, headerRow, findColumn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSheetData('Sheet1!1:1')];
                case 1:
                    headers = _a.sent();
                    console.log('Sheet headers:', headers === null || headers === void 0 ? void 0 : headers[0]);
                    if (!(headers === null || headers === void 0 ? void 0 : headers[0]))
                        throw new Error('Could not find headers in spreadsheet');
                    headerRow = headers[0];
                    findColumn = function (name) {
                        var index = headerRow.findIndex(function (header) {
                            return header.toLowerCase().trim() === name.toLowerCase().trim();
                        });
                        if (index === -1)
                            throw new Error("Could not find column: ".concat(name));
                        return index;
                    };
                    return [2 /*return*/, {
                            client: findColumn('Client'),
                            episodeTitle: findColumn('Episode title'),
                            type: findColumn('Type'),
                            earnedAfterFees: findColumn('$ after fee'),
                            invoicedAmount: findColumn('$ invoiced'),
                            billedMinutes: findColumn('Billed minutes'),
                            lengthHours: findColumn('Episode length hours'),
                            lengthMinutes: findColumn('Episode length minutes'),
                            lengthSeconds: findColumn('Episode length seconds'),
                            paymentMethod: findColumn('Payment method'),
                            editingHours: findColumn('Hours spent editing'),
                            editingMinutes: findColumn('Minutes spent editing'),
                            editingSeconds: findColumn('Seconds spent editing'),
                            billableHours: findColumn('Billable hours'),
                            runningHourlyTotal: findColumn('Running Hourly Total'),
                            ratePerMinute: findColumn('Rate per minute'),
                            dateInvoiced: findColumn('Date invoiced'),
                            datePaid: findColumn('Date paid'),
                            note: findColumn('Note')
                        }];
            }
        });
    });
}
function getSheetData(range) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, sheets, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getAuthToken()];
                case 1:
                    auth = _a.sent();
                    sheets = googleapis_1.google.sheets({ version: 'v4', auth: auth });
                    return [4 /*yield*/, sheets.spreadsheets.values.get({
                            spreadsheetId: GOOGLE_SHEET_ID,
                            range: range,
                        })];
                case 2:
                    response = _a.sent();
                    return [2 /*return*/, response.data.values];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error reading from Google Sheet:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Update function signatures
function updateSheetData(rowIndex, values) {
    return __awaiter(this, void 0, void 0, function () {
        var columns_1, auth, sheets, rowData_1, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getColumnIndices()];
                case 1:
                    columns_1 = _a.sent();
                    return [4 /*yield*/, getAuthToken()];
                case 2:
                    auth = _a.sent();
                    sheets = googleapis_1.google.sheets({ version: 'v4', auth: auth });
                    rowData_1 = new Array(Math.max.apply(Math, Object.values(columns_1)) + 1).fill('');
                    Object.entries(values).forEach(function (_a) {
                        var key = _a[0], value = _a[1];
                        var columnIndex = columns_1[key];
                        if (columnIndex !== undefined) {
                            rowData_1[columnIndex] = value;
                        }
                    });
                    return [4 /*yield*/, sheets.spreadsheets.values.update({
                            spreadsheetId: GOOGLE_SHEET_ID,
                            range: "Sheet1!A".concat(rowIndex, ":").concat(String.fromCharCode(65 + rowData_1.length)).concat(rowIndex),
                            valueInputOption: 'USER_ENTERED',
                            requestBody: {
                                values: [rowData_1],
                            },
                        })];
                case 3:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
                case 4:
                    error_2 = _a.sent();
                    console.error('Error updating Google Sheet:', error_2);
                    throw error_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function appendSheetData(values) {
    return __awaiter(this, void 0, void 0, function () {
        var columns_2, auth, sheets, rowData_2, response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getColumnIndices()];
                case 1:
                    columns_2 = _a.sent();
                    return [4 /*yield*/, getAuthToken()];
                case 2:
                    auth = _a.sent();
                    sheets = googleapis_1.google.sheets({ version: 'v4', auth: auth });
                    rowData_2 = new Array(Math.max.apply(Math, Object.values(columns_2)) + 1).fill('');
                    Object.entries(values).forEach(function (_a) {
                        var key = _a[0], value = _a[1];
                        var columnIndex = columns_2[key];
                        if (columnIndex !== undefined) {
                            rowData_2[columnIndex] = value;
                        }
                    });
                    return [4 /*yield*/, sheets.spreadsheets.values.append({
                            spreadsheetId: GOOGLE_SHEET_ID,
                            range: 'Sheet1!A:Z',
                            valueInputOption: 'USER_ENTERED',
                            requestBody: {
                                values: [rowData_2],
                            },
                        })];
                case 3:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
                case 4:
                    error_3 = _a.sent();
                    console.error('Error appending to Google Sheet:', error_3);
                    throw error_3;
                case 5: return [2 /*return*/];
            }
        });
    });
}
