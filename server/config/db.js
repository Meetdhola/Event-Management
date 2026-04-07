const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        // Windows: Node's SRV lookup often fails with querySrv ECONNREFUSED while nslookup works
        // (ISP DNS vs c-ares). Use public resolvers for mongodb+srv unless DNS_SERVERS is set.
        if (uri?.startsWith('mongodb+srv')) {
            if (process.env.DNS_SERVERS) {
                dns.setServers(
                    process.env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
                );
            } else if (process.platform === 'win32') {
                dns.setServers(['8.8.8.8', '1.1.1.1']);
            }
            dns.setDefaultResultOrder('ipv4first');
        }

        const conn = await mongoose.connect(uri, {
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
