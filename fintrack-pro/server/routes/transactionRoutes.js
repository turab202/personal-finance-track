import express     from 'express';
import Transaction from '../models/Transaction.js';
import jwt         from 'jsonwebtoken';
import multer      from 'multer';
import path        from 'path';

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/* ---------- Multer upload ---------- */
const storage = multer.diskStorage({
  destination: (_,__,cb)=> cb(null, path.resolve('uploads')),
  filename:   (_,file,cb)=> cb(null, Date.now() + '_' + file.originalname.replace(/\s+/g,'_')),
});
const upload = multer({ storage });

/* ---------- Auth middleware ---------- */
function auth(req,res,next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({message:'Unauthorized'});
  try{ req.userId = jwt.verify(token, JWT_SECRET).id; next(); }
  catch{ res.status(401).json({message:'Invalid token'}); }
}

/* ---------- CREATE ---------- */
router.post('/', auth, upload.single('file'), async (req,res)=>{
  try{
    const { description, amount, date, category, isRecurring, repeatInterval } = req.body;
    const tx = await Transaction.create({
      userId:req.userId, description, amount, date, category,
      isRecurring: !!isRecurring,
      repeatInterval: isRecurring ? repeatInterval : null,
      attachment: req.file ? req.file.filename : null,
    });
    res.status(201).json(tx);
  }catch(e){ res.status(500).json({message:'Failed to add'}); }
});

/* ---------- READ ---------- */
router.get('/', auth, async (req,res)=>{
  try{
    const txs = await Transaction.find({userId:req.userId}).sort({date:-1});
    res.json(txs);
  }catch{ res.status(500).json({message:'Failed to fetch'}); }
});

/* ---------- UPDATE ---------- */
router.put('/:id', auth, upload.single('file'), async (req,res)=>{
  try{
    const { description, amount, date, category, isRecurring, repeatInterval } = req.body;
    const updated = await Transaction.findOneAndUpdate(
      { _id:req.params.id, userId:req.userId },
      {
        description, amount, date, category,
        isRecurring: !!isRecurring,
        repeatInterval: isRecurring ? repeatInterval : null,
        ...(req.file && { attachment:req.file.filename })
      },
      { new:true }
    );
    if(!updated) return res.status(404).json({message:'Not found'});
    res.json(updated);
  }catch{ res.status(500).json({message:'Update error'}); }
});

/* ---------- DELETE ---------- */
router.delete('/:id', auth, async (req,res)=>{
  try{
    const del = await Transaction.findOneAndDelete({_id:req.params.id, userId:req.userId});
    if(!del) return res.status(404).json({message:'Not found'});
    res.json({message:'Deleted'});
  }catch{ res.status(500).json({message:'Delete error'}); }
});

/* serve uploaded files */
router.use('/files', express.static('uploads'));
export default router;
