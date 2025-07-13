import cron        from 'node-cron';
import Transaction  from './models/Transaction.js';

cron.schedule('0 2 * * *', async ()=>{
  const templates = await Transaction.find({ isRecurring:true });
  const today     = new Date();

  for(const tpl of templates){
    const due =
      ( tpl.repeatInterval==='weekly'  && today.getDay() === new Date(tpl.date).getDay()) ||
      ( tpl.repeatInterval==='monthly' && today.getDate()=== new Date(tpl.date).getDate());

    if(due){
      await Transaction.create({
        userId: tpl.userId,
        description: tpl.description,
        amount: tpl.amount,
        date: today,
        category: tpl.category
      });
    }
  }
});
