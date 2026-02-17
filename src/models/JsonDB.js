
import fs from 'fs';
import path from 'path';

class JsonDB {
    constructor(file, defaultData) {
        this.file = file;
        this.defaultData = defaultData;
        this.data = null;
        this.init();
    }

    init() {
        const dir = path.dirname(this.file);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.file)) {
            fs.writeFileSync(this.file, JSON.stringify(this.defaultData, null, 2));
            this.data = this.defaultData;
        }
    }

    async read() {
        if (!fs.existsSync(this.file)) {
            this.init();
        }
        const content = fs.readFileSync(this.file, 'utf-8');
        try {
            this.data = JSON.parse(content);
        } catch (e) {
            this.data = this.defaultData;
        }
        return this.data;
    }

    async write() {
        // await this.read(); 
        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    }

    async findOne(collectionName, criteria) {
        await this.read();
        const collection = this.data[collectionName];
        if (!collection) return null;
        
        return collection.find(item => {
            return Object.keys(criteria).every(key => item[key] === criteria[key]);
        });
    }

    async push(collectionName, item) {
        await this.read();
        if (!this.data[collectionName]) {
            this.data[collectionName] = [];
        }
        this.data[collectionName].push(item);
        await this.write();
        return item;
    }

    async update(collectionName, criteria, updates) {
        await this.read();
        const collection = this.data[collectionName];
        if (!collection) return null;

        const index = collection.findIndex(item => {
             return Object.keys(criteria).every(key => item[key] === criteria[key]);
        });
        
        if(index !== -1) {
            this.data[collectionName][index] = { ...collection[index], ...updates };
            await this.write();
            return this.data[collectionName][index];
        }
        return null;
    }

    async remove(collectionName, criteria) {
        await this.read();
         const collection = this.data[collectionName];
        if (!collection) return null;

        const initialLength = collection.length;
        this.data[collectionName] = collection.filter(item => {
             return !Object.keys(criteria).every(key => item[key] === criteria[key]);
        });
        
        await this.write();
        return initialLength !== this.data[collectionName].length;
    }
}

export default JsonDB;
