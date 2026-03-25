# PDF Chatbot - Simple Guide

## 🎯 What This Does

Ask questions about the DS-Catalogue.pdf and get instant answers with sources!

---

## 🚀 Easiest Way to Run

### First Time Setup:
```bash
cd pdf-chatbot/frontend
npm install
```

### Every Time You Want to Use It:

**Option 1: Use the batch file (Windows)**
```bash
cd pdf-chatbot
START_ALL.bat
```

**Option 2: Manual (3 terminals)**

Terminal 1:
```bash
cd pdf-chatbot
docker-compose up -d qdrant
```

Terminal 2:
```bash
cd pdf-chatbot/backend
python -m api.main
```

Terminal 3:
```bash
cd pdf-chatbot/frontend
npm run dev
```

### Open Your Browser:
```
http://localhost:3000
```

---

## 🛑 How to Stop

**Option 1: Use the batch file**
```bash
cd pdf-chatbot
STOP_ALL.bat
```

**Option 2: Manual**
- Close Terminal 2 and 3 (Ctrl+C)
- Run: `docker-compose down`

---

## 💬 Try These Questions

- "What products are available?"
- "Tell me about aluminium conductors"
- "What are the specifications for suspension fittings?"
- "Show me products with part number 4326.01"

---

## ✅ System Status

- ✅ Backend configured
- ✅ 128 chunks indexed in Qdrant
- ✅ Azure OpenAI connected
- ✅ Ready to use!

---

## 📚 More Information

- `RUN_ME_FIRST.md` - Detailed setup guide
- `HOW_TO_RUN.md` - Complete instructions
- `SYSTEM_TEST_RESULTS.md` - Test results

---

## 🆘 Problems?

**Docker not running?**
→ Start Docker Desktop

**Port already in use?**
→ Run `STOP_ALL.bat` first

**No search results?**
→ Run: `cd backend && python ingest.py`

**Need to reinstall?**
→ Delete `node_modules` and run `npm install` again

---

That's it! Enjoy your PDF Chatbot! 🎉
