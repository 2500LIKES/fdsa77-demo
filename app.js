/* =========================================================
   FDSA77 - DEMO
   Supabase version
   ใช้เครดิตจำลองเท่านั้น
========================================================= */

/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://xsjusojjwpzhbfsbmkax.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_LC69PMvBvzkF6n6sMRFzEg_TIjTtkUZ";

let db = null;


/* โหลด Supabase อัตโนมัติ */
function loadSupabase(){
  return new Promise((resolve,reject)=>{

    if(window.supabase){
      resolve();
      return;
    }

    const script=document.createElement("script");

    script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload=()=>resolve();

    script.onerror=()=>reject(
      new Error("โหลด Supabase ไม่สำเร็จ")
    );

    document.head.appendChild(script);

  });
}


/* เริ่มระบบ */
(async function(){

  try{

    await loadSupabase();

    db=window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    console.log("Supabase connected");

  }catch(err){

    console.error(err);

  }

})();


/* =========================
   ADMIN DEMO
========================= */

const ADMIN_USER="a5";
const ADMIN_PASS="5G";


/* =========================
   GAME VARIABLES
========================= */

let current=null;
let bet=0;
let multiplier=1;
let reward=0;
let playing=false;
let timer=null;

let selectedAddUser=-1;
let selectedRemoveUser=-1;


/* =========================
   HELPERS
========================= */

function money(n){
  return Number(n||0).toFixed(2);
}


async function getUser(username){

  if(!db) throw new Error("Supabase ยังไม่พร้อม");

  const {data,error}=await db
    .from("fdsa77_users")
    .select("*")
    .eq("username",username)
    .maybeSingle();

  if(error) throw error;

  return data;
}


async function getUsers(){

  if(!db) throw new Error("Supabase ยังไม่พร้อม");

  const {data,error}=await db
    .from("fdsa77_users")
    .select("*")
    .order("id",{ascending:true});

  if(error) throw error;

  return data || [];
}


async function updateUser(id,changes){

  if(!db) throw new Error("Supabase ยังไม่พร้อม");

  const {data,error}=await db
    .from("fdsa77_users")
    .update(changes)
    .eq("id",id)
    .select()
    .single();

  if(error) throw error;

  return data;
}


/* =========================
   PAGE
========================= */

function show(id){

  document
    .querySelectorAll(
      "#loginPage,#regPage,#gamePage,#walletPage,#historyPage,#profilePage,#adminPage"
    )
    .forEach(x=>x.classList.add("hidden"));

  const page=document.getElementById(id);

  if(page){
    page.classList.remove("hidden");
  }

}


/* =========================
   REGISTER
========================= */

async function register(){

  const u=document
    .getElementById("regUser")
    .value
    .trim();

  const p=document
    .getElementById("regPass")
    .value;

  const msg=document.getElementById("regMsg");

  msg.textContent="กำลังสร้างบัญชี...";

  if(!u || !p){

    msg.textContent="กรุณากรอกชื่อผู้ใช้และรหัสผ่าน";

    return;
  }

  if(u.length<3){

    msg.textContent="ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร";

    return;
  }

  if(p.length<4){

    msg.textContent="รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";

    return;
  }

  try{

    if(!db){

      await loadSupabase();

      db=window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

    }


    /* ตรวจชื่อซ้ำ */

    const old=await getUser(u);

    if(old){

      msg.textContent="ชื่อผู้ใช้นี้มีอยู่แล้ว";

      return;
    }


    /* สร้างบัญชี */

    const {data,error}=await db
      .from("fdsa77_users")
      .insert({

        username:u,

        password:p,

        balance:0,

        blocked:false,

        history:[],

        transactions:[]

      })
      .select()
      .single();


    if(error){

      console.error(error);

      msg.textContent=
        "สมัครสมาชิกไม่สำเร็จ: "+error.message;

      return;
    }


    msg.textContent="สร้างบัญชีสำเร็จ";

    document.getElementById("regUser").value="";
    document.getElementById("regPass").value="";


    setTimeout(()=>{

      show("loginPage");

    },700);


  }catch(err){

    console.error(err);

    msg.textContent=
      "สมัครสมาชิกไม่สำเร็จ: "+err.message;

  }

}


/* =========================
   LOGIN
========================= */

async function login(){

  const u=document
    .getElementById("loginUser")
    .value
    .trim();

  const p=document
    .getElementById("loginPass")
    .value;

  const msg=document.getElementById("loginMsg");

  msg.textContent="กำลังเข้าสู่ระบบ...";


  /* ADMIN DEMO */

  if(u===ADMIN_USER && p===ADMIN_PASS){

    current={
      id:"admin",
      username:ADMIN_USER,
      password:ADMIN_PASS,
      balance:0,
      blocked:false,
      history:[],
      transactions:[]
    };

    msg.textContent="เข้าสู่ระบบ Admin สำเร็จ";

    setTimeout(()=>{

      gamePage();

      document
        .getElementById("adminBtn")
        .classList.remove("hidden");

    },500);

    return;
  }


  try{

    const user=await getUser(u);


    if(!user){

      msg.textContent="ไม่พบชื่อผู้ใช้";

      return;
    }


    if(user.password!==p){

      msg.textContent="รหัสผ่านไม่ถูกต้อง";

      return;
    }


    if(user.blocked){

      msg.textContent="บัญชีนี้ถูกระงับ";

      return;
    }


    current=user;

    msg.textContent="เข้าสู่ระบบสำเร็จ";


    setTimeout(()=>{

      gamePage();

      document
        .getElementById("adminBtn")
        .classList.add("hidden");

    },500);


  }catch(err){

    console.error(err);

    msg.textContent=
      "เข้าสู่ระบบไม่สำเร็จ: "+err.message;

  }

}


/* =========================
   GAME PAGE
========================= */

async function gamePage(){

  if(!current){

    show("loginPage");

    return;
  }


  show("gamePage");


  if(current.username===ADMIN_USER){

    document
      .getElementById("adminBtn")
      .classList.remove("hidden");

  }else{

    document
      .getElementById("adminBtn")
      .classList.add("hidden");

  }


  await refreshCurrent();

}


/* =========================
   REFRESH USER
========================= */

async function refreshCurrent(){

  if(!current) return;

  if(current.username===ADMIN_USER){

    document.getElementById("balance").textContent="0.00";

    return;
  }


  try{

    const user=await getUser(current.username);

    if(user){

      current=user;

      document.getElementById("balance")
        .textContent=money(user.balance);

    }

  }catch(err){

    console.error(err);

  }

}


/* =========================
   SELECT BET
========================= */

function selectBet(amount,button){

  if(playing) return;

  bet=Number(amount);

  document
    .querySelectorAll(".amount")
    .forEach(x=>x.classList.remove("active"));

  if(button){

    button.classList.add("active");

  }


  document.getElementById("betDisplay")
    .textContent="฿"+money(bet);


  document.getElementById("status")
    .textContent="เลือกจำนวนเงินจำลองแล้วกดเริ่ม";

}


/* =========================
   START GAME
========================= */
let explodePercent = 1.8;

async function loadExplodePercent(){
  try{
    const { data, error } = await supabase
      .from("fdsa77_settings")
      .select("value")
      .eq("key", "explode_percent")
      .maybeSingle();

    if(error) throw error;

    if(data){
      explodePercent = Number(data.value) || 1.8;
    }
  }catch(err){
    console.error("โหลดค่า % ไม่สำเร็จ:", err);
  }
}

async function saveExplodePercent(){
  if(!current || current.username !== ADMIN_USER){
    alert("เฉพาะ Admin เท่านั้น");
    return;
  }

  const input = document.getElementById("explodePercent");
  const value = Number(input.value);

  if(!Number.isFinite(value) || value < 1 || value > 100){
    alert("กรุณาใส่ค่าระหว่าง 1-100%");
    return;
  }

  const { error } = await supabase
    .from("fdsa77_settings")
    .upsert({
      key: "explode_percent",
      value: String(value)
    }, {
      onConflict: "key"
    });

  if(error){
    console.error(error);
    document.getElementById("explodeStatus").textContent =
      "❌ บันทึกไม่สำเร็จ";
    return;
  }

  explodePercent = value;

  document.getElementById("explodeStatus").textContent =
    "✅ ตั้งค่าไก่ระเบิด " + value + "% แล้ว";
}
async function startGame(){

  if(playing) return;
playing=true;

  if(!current) return;


  if(!bet){

    document.getElementById("status")
      .textContent="กรุณาเลือกจำนวนเงินจำลอง";

    return;
  }


  if(current.username!==ADMIN_USER){

    await refreshCurrent();

    if(Number(current.balance)<bet){

      document.getElementById("status")
        .textContent="เครดิตจำลองไม่พอ";

      return;
    }


    /* หักเครดิตตอนเริ่ม */

    current.balance=
      Number(current.balance)-bet;


    try{

      await updateUser(
        current.id,
        {
          balance:current.balance
        }
      );

    }catch(err){

      current.balance=
        Number(current.balance)+bet;

      document.getElementById("status")
        .textContent="บันทึกเครดิตไม่สำเร็จ";

      return;
    }

  }


  multiplier=1;

  reward=bet;

  playing=true;


  document.getElementById("start")
    .classList.add("hidden");

  document.getElementById("cash")
    .classList.remove("hidden");


  document.getElementById("status")
    .textContent="กำลังวิ่ง... กดหยุดเพื่อรับรางวัลจำลอง";


  document.getElementById("multi")
    .textContent="1.00";


  document.getElementById("reward")
    .textContent=money(reward);


  timer=setInterval(()=>{

    multiplier+=0.01+Math.random()*0.025;

    multiplier=
      Number(multiplier.toFixed(2));

    reward=bet*multiplier;


    document.getElementById("multi")
      .textContent=multiplier.toFixed(2);


    document.getElementById("reward")
      .textContent=money(reward);


    /*
      DEMO เท่านั้น
      สุ่มจบเกม ไม่มีเงินจริง
    */

    if(Math.random()<0.018){

      explode();

    }

  },100);

}


/* =========================
   CASHOUT
========================= */

async function cashout(){

  if(!playing) return;

  clearInterval(timer);

  playing=false;


  document.getElementById("start")
    .classList.remove("hidden");

  document.getElementById("cash")
    .classList.add("hidden");


  if(current.username!==ADMIN_USER){

    current.balance=
      Number(current.balance)+reward;


    try{

      await updateUser(
        current.id,
        {
          balance:current.balance
        }
      );

    }catch(err){

      console.error(err);

      document.getElementById("status")
        .textContent="บันทึกรางวัลไม่สำเร็จ";

      return;
    }

  }


  await addGameHistory(
    "รับรางวัล",
    bet,
    multiplier,
    reward
  );


  document.getElementById("status")
    .textContent=
      "รับรางวัลจำลอง ฿"+money(reward);


  document.getElementById("balance")
    .textContent=money(current.balance);

}


/* =========================
   EXPLODE
========================= */

async function explode(){

  if(!playing) return;

  clearInterval(timer);

  playing=false;


  document.getElementById("start")
    .classList.remove("hidden");

  document.getElementById("cash")
    .classList.add("hidden");


  await addGameHistory(
    "จบรอบ",
    bet,
    multiplier,
    0
  );


  document.getElementById("status")
    .textContent=
      "🐔 จบรอบที่ "+multiplier.toFixed(2)+"x";


  document.getElementById("reward")
    .textContent="0.00";

}


/* =========================
   GAME HISTORY
========================= */

async function addGameHistory(
  type,
  amount,
  multi,
  result
){

  if(!current || current.username===ADMIN_USER){

    return;
  }


  try{

    const user=await getUser(current.username);

    let history=
      Array.isArray(user.history)
        ? user.history
        : [];


    history.unshift({

      type:type,

      amount:Number(amount||0),

      multiplier:Number(multi||0),

      reward:Number(result||0),

      time:new Date().toLocaleString("th-TH")

    });


    if(history.length>100){

      history=history.slice(0,100);

    }


    await updateUser(
      user.id,
      {
        history:history
      }
    );


    current.history=history;

  }catch(err){

    console.error(err);

  }

}


/* =========================
   SHOW HISTORY
========================= */

async function showHistory(){

  show("historyPage");


  const box=document.getElementById("history");

  box.innerHTML=
    '<p class="sub">กำลังโหลด...</p>';


  if(!current){

    return;
  }


  if(current.username===ADMIN_USER){

    box.innerHTML=
      '<p class="sub">Admin ไม่มีประวัติการเล่น</p>';

    return;
  }


  try{

    const user=await getUser(current.username);

    const history=
      Array.isArray(user.history)
        ? user.history
        : [];


    if(history.length===0){

      box.innerHTML=
        '<p class="sub">ยังไม่มีประวัติการเล่น</p>';

      return;
    }


    box.innerHTML=history.map(item=>`

      <div class="list">

        <b>${item.type||"รอบเกม"}</b>

        <br>

        <span class="sub">
          จำนวน ฿${money(item.amount)}
          • ${Number(item.multiplier||0).toFixed(2)}x
        </span>

        <br>

        <span class="${
          Number(item.reward)>0
            ? "green"
            : "redtext"
        }">

          รางวัล ฿${money(item.reward)}

        </span>

        <br>

        <span class="sub">
          ${item.time||""}
        </span>

      </div>

    `).join("");


  }catch(err){

    box.innerHTML=
      '<p class="redtext">'+err.message+'</p>';

  }

}


/* =========================
   WALLET
========================= */

async function showWallet(){

  show("walletPage");

  await loadWalletHistory();

}


/* =========================
   DEPOSIT DEMO
========================= */

async function deposit(){

  if(!current || current.username===ADMIN_USER){

    alert("Admin ไม่สามารถส่งรายการฝาก");

    return;
  }


  const input=
    document.getElementById("depositAmount");

  const amount=
    Number(input.value);


  if(!amount || amount<=0){

    alert("กรุณาใส่จำนวนเงินจำลอง");

    return;
  }


  await addTransaction(
    "ฝาก",
    amount,
    "รอติดต่อแอดมิน"
  );


  input.value="";


  alert(
    "ส่งคำขอฝากเครดิตจำลองแล้ว\nกรุณาติดต่อแอดมิน"
  );


  await loadWalletHistory();

}


/* =========================
   WITHDRAW DEMO
========================= */

async function withdraw(){

  if(!current || current.username===ADMIN_USER){

    alert("Admin ไม่สามารถส่งรายการถอน");

    return;
  }


  const input=
    document.getElementById("withdrawAmount");

  const amount=
    Number(input.value);


  if(!amount || amount<=0){

    alert("กรุณาใส่จำนวนเงินจำลอง");

    return;
  }


  if(amount>Number(current.balance)){

    alert("เครดิตจำลองไม่พอ");

    return;
  }


  await addTransaction(
    "ถอน",
    amount,
    "รอติดต่อแอดมิน"
  );


  input.value="";


  alert(
    "ส่งคำขอถอนเครดิตจำลองแล้ว\nกรุณาติดต่อแอดมิน"
  );


  await loadWalletHistory();

}


/* =========================
   TRANSACTION
========================= */

async function addTransaction(
  type,
  amount,
  status
){

  if(!current) return;


  const user=await getUser(current.username);


  let transactions=
    Array.isArray(user.transactions)
      ? user.transactions
      : [];


  transactions.unshift({

    type:type,

    amount:Number(amount),

    status:status,

    time:new Date().toLocaleString("th-TH")

  });


  if(transactions.length>100){

    transactions=transactions.slice(0,100);

  }


  await updateUser(
    user.id,
    {
      transactions:transactions
    }
  );


  current.transactions=transactions;

}


/* =========================
   WALLET HISTORY
========================= */

async function loadWalletHistory(){

  const box=
    document.getElementById("walletHistory");


  if(!box) return;


  box.innerHTML=
    '<p class="sub">กำลังโหลด...</p>';


  if(!current){

    box.innerHTML="";

    return;
  }


  if(current.username===ADMIN_USER){

    box.innerHTML=
      '<p class="sub">Admin ไม่มีรายการฝากถอน</p>';

    return;
  }


  try{

    const user=
      await getUser(current.username);


    const list=
      Array.isArray(user.transactions)
        ? user.transactions
        : [];


    if(list.length===0){

      box.innerHTML=
        '<p class="sub">ยังไม่มีรายการ</p>';

      return;
    }


    box.innerHTML=list.map(item=>`

      <div class="list">

        <b>
          ${item.type==="ฝาก" ? "📥" : "📤"}
          ${item.type}
        </b>

        <br>

        <span>
          ฿${money(item.amount)}
        </span>

        <br>

        <span class="yellow">
          ${item.status}
        </span>

        <br>

        <span class="sub">
          ${item.time||""}
        </span>

      </div>

    `).join("");


  }catch(err){

    box.innerHTML=
      '<p class="redtext">'+err.message+'</p>';

  }

}


/* =========================
   PROFILE
========================= */

async function showProfile(){

  show("profilePage");


  if(!current) return;


  document.getElementById("pUser")
    .textContent=current.username;


  if(current.username===ADMIN_USER){

    document.getElementById("pBalance")
      .textContent="0.00";

    return;
  }


  try{

    const user=
      await getUser(current.username);


    current=user;


    document.getElementById("pBalance")
      .textContent=money(user.balance);


  }catch(err){

    console.error(err);

  }

}


/* =========================
   ADMIN
========================= */

async function showAdmin(){

  if(!current || current.username!==ADMIN_USER){

    alert("ไม่มีสิทธิ์");

    return;
  }


  show("adminPage");

  await renderUsers();

}


/* =========================
   RENDER USERS
========================= */

async function renderUsers(){

  const box=
    document.getElementById("users");


  box.innerHTML=
    '<p class="sub">กำลังโหลดสมาชิก...</p>';


  try{

    const list=await getUsers();


    if(list.length===0){

      box.innerHTML=
        '<p class="sub">ยังไม่มีสมาชิก</p>';

      return;
    }


    box.innerHTML=list.map((user,index)=>`

      <div class="user">

        <b>${user.username}</b>

        <br>

        <span class="sub">
          เครดิตจำลอง:
        </span>

        <span class="green">
          ฿${money(user.balance)}
        </span>

        <br>

        <span class="${
          user.blocked
            ? "redtext"
            : "green"
        }">

          ${
            user.blocked
              ? "ถูกระงับ"
              : "ปกติ"
          }

        </span>


        <button
          onclick="openAddModal(${user.id},'${escapeHtml(user.username)}')"
        >
          ➕ เพิ่มเครดิต
        </button>


        <button
          class="red"
          onclick="openRemoveModal(${user.id},'${escapeHtml(user.username)}')"
        >
          ➖ ลดเครดิต
        </button>


        <button
          class="secondary"
          onclick="toggleBlock(${user.id},${user.blocked})"
        >

          ${
            user.blocked
              ? "🔓 ปลดระงับ"
              : "🔒 ระงับ"
          }

        </button>


        <button
          class="secondary"
          onclick="adminViewTransactions(${user.id})"
        >
          📜 ดูฝาก-ถอน
        </button>

      </div>

    `).join("");


  }catch(err){

    console.error(err);

    box.innerHTML=
      '<p class="redtext">'+err.message+'</p>';

  }

}


/* =========================
   ESCAPE
========================= */

function escapeHtml(str){

  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================
   ADD MODAL
========================= */

function openAddModal(id,name){

  selectedAddUser=id;

  document.getElementById("addUserName")
    .textContent="สมาชิก: "+name;

  document.getElementById("addAmountInput")
    .value="";

  document.getElementById("addModal")
    .classList.remove("hidden");

}


function closeAddModal(){

  selectedAddUser=-1;

  document.getElementById("addModal")
    .classList.add("hidden");

}


/* =========================
   CONFIRM ADD
========================= */

async function confirmAddMoney(){

  if(selectedAddUser===-1) return;


  const amount=
    Number(
      document.getElementById("addAmountInput").value
    );


  if(!amount || amount<=0){

    alert("กรุณาใส่จำนวนเครดิต");

    return;
  }


  try{

    const list=await getUsers();

    const user=list.find(
      x=>Number(x.id)===Number(selectedAddUser)
    );


    if(!user){

      alert("ไม่พบสมาชิก");

      return;
    }


    await updateUser(
      user.id,
      {
        balance:
          Number(user.balance||0)+amount
      }
    );


    closeAddModal();

    await renderUsers();

    alert("เพิ่มเครดิตจำลองสำเร็จ");


  }catch(err){

    console.error(err);

    alert(
      "เพิ่มเครดิตไม่สำเร็จ: "+
      err.message
    );

  }

}


/* =========================
   REMOVE MODAL
========================= */
function openRemoveModal(id,name){

  selectedRemoveUser=id;

  document.getElementById("removeUserName")
    .textContent="สมาชิก: "+name;

  document.getElementById("removeAmountInput")
    .value="";

  document.getElementById("removeModal")
    .classList.remove("hidden");
}


function closeRemoveModal(){

  selectedRemoveUser=-1;

  document.getElementById("removeModal")
    .classList.add("hidden");
}


async function confirmRemoveMoney(){

  if(selectedRemoveUser===-1) return;

  const amount=Number(
    document.getElementById("removeAmountInput").value
  );

  if(!amount || amount<=0){

    alert("กรุณาใส่จำนวนเครดิต");

    return;
  }

  try{

    const list=await getUsers();

    const user=list.find(
      x=>Number(x.id)===Number(selectedRemoveUser)
    );

    if(!user){

      alert("ไม่พบสมาชิก");

      return;
    }

    const newBalance=Math.max(
      0,
      Number(user.balance||0)-amount
    );

    await updateUser(
      user.id,
      {
        balance:newBalance
      }
    );

    closeRemoveModal();

    await renderUsers();

    alert("ลดเครดิตจำลองสำเร็จ");

  }catch(err){

    console.error(err);

    alert(
      "ลดเครดิตไม่สำเร็จ: "+err.message
    );
  }
}


async function toggleBlock(id,blocked){

  try{

    await updateUser(
      id,
      {
        blocked:!blocked
      }
    );

    await renderUsers();

  }catch(err){

    console.error(err);

    alert(
      "เปลี่ยนสถานะไม่สำเร็จ: "+err.message
    );
  }
}


async function adminViewTransactions(id){

  try{

    const list=await getUsers();

    const user=list.find(
      x=>Number(x.id)===Number(id)
    );

    if(!user){

      alert("ไม่พบสมาชิก");

      return;
    }

    const transactions=
      Array.isArray(user.transactions)
        ? user.transactions
        : [];

    if(transactions.length===0){

      alert(
        "สมาชิก "+user.username+
        " ยังไม่มีรายการฝาก-ถอน"
      );

      return;
    }

    let text=
      "รายการของ "+user.username+"\n\n";

    transactions.slice(0,20).forEach((x,i)=>{

      text+=
        (i+1)+". "+
        x.type+
        " ฿"+money(x.amount)+
        " | "+
        x.status+
        "\n";

    });

    alert(text);

  }catch(err){

    alert(err.message);

  }
}


function logout(){

  if(timer){

    clearInterval(timer);

  }

  current=null;
  bet=0;
  multiplier=1;
  reward=0;
  playing=false;

  document.getElementById("loginUser").value="";
  document.getElementById("loginPass").value="";
  document.getElementById("loginMsg").textContent="";

  show("loginPage");
}


window.show=show;
window.register=register;
window.login=login;
window.logout=logout;

window.gamePage=gamePage;

window.selectBet=selectBet;
window.startGame=startGame;
window.cashout=cashout;

window.showHistory=showHistory;
window.showWallet=showWallet;
window.showProfile=showProfile;
window.showAdmin=showAdmin;

window.deposit=deposit;
window.withdraw=withdraw;

window.openAddModal=openAddModal;
window.closeAddModal=closeAddModal;
window.confirmAddMoney=confirmAddMoney;

window.openRemoveModal=openRemoveModal;
window.closeRemoveModal=closeRemoveModal;
window.confirmRemoveMoney=confirmRemoveMoney;

window.toggleBlock=toggleBlock;
window.adminViewTransactions=adminViewTransactions;