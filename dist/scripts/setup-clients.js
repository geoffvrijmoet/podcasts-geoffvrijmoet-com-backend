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
var dotenv = require("dotenv");
var path_1 = require("path");
// Load environment variables from .env.local
var envPath = (0, path_1.resolve)(process.cwd(), '.env.local');
console.log('Loading environment variables from:', envPath);
var result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
function setupClientsAndUpdateInvoices() {
    return __awaiter(this, void 0, void 0, function () {
        var client, db, clientsCollection, invoicesCollection, clients, result_1, clientMap_1, _loop_1, _i, _a, _b, index, id, invoices, updatedCount, skippedCount, _c, invoices_1, invoice, clientId, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!process.env.MONGODB_URI) {
                        throw new Error('MONGODB_URI environment variable is not set');
                    }
                    client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 10, 11, 13]);
                    return [4 /*yield*/, client.connect()];
                case 2:
                    _d.sent();
                    console.log('Connected to MongoDB');
                    db = client.db();
                    clientsCollection = db.collection('clients');
                    invoicesCollection = db.collection('invoices');
                    clients = [
                        {
                            name: 'Making Movies is Hard',
                            email: 'alrik@bursellproductions.com',
                            aliases: ['MMIH', 'Making Movies is Hard'],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            name: "That's My Girl",
                            email: 'thatsmygirlinfo@gmail.com',
                            aliases: ["That's My Girl"],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            name: 'Just Screen It',
                            email: 'colin@darkrosepictures.com',
                            aliases: ['Just Screen It', 'Colin Stryker'],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ];
                    // Insert clients
                    console.log('Inserting clients...');
                    return [4 /*yield*/, clientsCollection.insertMany(clients)];
                case 3:
                    result_1 = _d.sent();
                    console.log("Inserted ".concat(result_1.insertedCount, " clients"));
                    clientMap_1 = new Map();
                    _loop_1 = function (index, id) {
                        var client_1 = clients[Number(index)];
                        // Add both the main name and aliases to the map
                        client_1.aliases.forEach(function (alias) {
                            clientMap_1.set(alias, id);
                        });
                    };
                    for (_i = 0, _a = Object.entries(result_1.insertedIds); _i < _a.length; _i++) {
                        _b = _a[_i], index = _b[0], id = _b[1];
                        _loop_1(index, id);
                    }
                    // Update all invoices with their corresponding client IDs
                    console.log('Updating invoices with client references...');
                    return [4 /*yield*/, invoicesCollection.find({}).toArray()];
                case 4:
                    invoices = _d.sent();
                    updatedCount = 0;
                    skippedCount = 0;
                    _c = 0, invoices_1 = invoices;
                    _d.label = 5;
                case 5:
                    if (!(_c < invoices_1.length)) return [3 /*break*/, 9];
                    invoice = invoices_1[_c];
                    clientId = clientMap_1.get(invoice.client);
                    if (!clientId) return [3 /*break*/, 7];
                    return [4 /*yield*/, invoicesCollection.updateOne({ _id: invoice._id }, {
                            $set: {
                                clientId: clientId,
                                updatedAt: new Date()
                            }
                        })];
                case 6:
                    _d.sent();
                    updatedCount++;
                    return [3 /*break*/, 8];
                case 7:
                    console.warn("No matching client found for invoice with client name: ".concat(invoice.client));
                    skippedCount++;
                    _d.label = 8;
                case 8:
                    _c++;
                    return [3 /*break*/, 5];
                case 9:
                    console.log("Successfully updated ".concat(updatedCount, " invoices with client references"));
                    console.log("Skipped ".concat(skippedCount, " invoices due to no matching client"));
                    return [3 /*break*/, 13];
                case 10:
                    error_1 = _d.sent();
                    console.error('Error during setup:', error_1);
                    throw error_1;
                case 11: return [4 /*yield*/, client.close()];
                case 12:
                    _d.sent();
                    console.log('Closed MongoDB connection');
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    });
}
// Run the setup
setupClientsAndUpdateInvoices()
    .then(function () {
    console.log('Setup completed successfully');
    process.exit(0);
})
    .catch(function (error) {
    console.error('Setup failed:', error);
    process.exit(1);
});
