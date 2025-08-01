// 取得 HTML 中的各項 DOM 元素
const cardForm = document.getElementById("cardForm");
const imageInput = document.getElementById("imageInput");
const cardList = document.getElementById("cardList");
const sortSelect = document.getElementById("sortSelect");

// ✅ 上傳圖片到 Google Drive（透過 Apps Script）
async function uploadToDrive(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      const formData = new URLSearchParams();
      formData.append("image", base64Image);
      formData.append("filename", file.name);

      try {
        const res = await fetch(
          "https://script.google.com/macros/s/AKfycbydJqLXeXTlN_t1yYGcqgCVbfBK4ZY1ePJCy3815_A4OhHxXVwQl7tIAvKrp9lt_YJd/exec",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
            redirect: "follow"
          }
        );

        const data = await res.json();
        console.log("📦 回傳資料：", data);

        if (data.success) {
          console.log("🖼️ 圖片網址：", data.url);
          resolve(data.url);
        } else {
          alert("圖片上傳失敗：" + data.message);
          resolve(null);
        }
      } catch (err) {
        console.error("❌ 圖片上傳錯誤：", err);
        alert("連線錯誤：" + err.message);
        resolve(null);
      }
    };

    reader.readAsDataURL(file);
  });
}

// ✅ 表單送出處理
cardForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = imageInput.files[0];
  if (!file) return alert("請選擇圖片");

  const imageUrl = await uploadToDrive(file);
  if (!imageUrl) return;

  const card = {
    id: Date.now(),
    title: document.getElementById("titleInput").value,
    note: document.getElementById("noteInput").value,
    date: document.getElementById("dateInput").value,
    price: Number(document.getElementById("priceInput").value),
    imageUrl,
    isFavorite: false
  };

  console.log("✅ 儲存卡片：", card);

  const cards = getCards();
  cards.push(card);
  saveCards(cards);
  renderCards();
  cardForm.reset();
});

// ✅ 取得所有卡片資料
function getCards() {
  return JSON.parse(localStorage.getItem("cards") || "[]");
}

// ✅ 儲存卡片資料
function saveCards(cards) {
  localStorage.setItem("cards", JSON.stringify(cards));
}

// ✅ 顯示所有卡片
function renderCards() {
  cardList.innerHTML = "";
  let cards = getCards();

  const sort = sortSelect.value;
  if (sort === "price-asc") cards.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") cards.sort((a, b) => b.price - a.price);
  if (sort === "date-asc")
    cards.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sort === "date-desc")
    cards.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const card of cards) {
    console.log("🔍 顯示圖片網址：", card.imageUrl);

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${card.imageUrl}" alt="小卡圖片" onerror="this.style.display='none'" />
      <div class="card-info">
        <strong>${card.title}</strong> ${card.isFavorite ? "⭐" : ""}<br/>
        <small>${card.date} | ${card.price} 元</small>
        <p>${card.note}</p>
        <button onclick="toggleFavorite(${card.id})">
          ${card.isFavorite ? "取消收藏" : "加入收藏"}
        </button>
        <button onclick="deleteCard(${card.id})">刪除</button>
      </div>
    `;
    cardList.appendChild(div);
  }
}

// ✅ 刪除卡片
function deleteCard(id) {
  const cards = getCards().filter((card) => card.id !== id);
  saveCards(cards);
  renderCards();
}

// ✅ 收藏/取消收藏切換
function toggleFavorite(id) {
  const cards = getCards();
  const card = cards.find((c) => c.id === id);
  if (card) card.isFavorite = !card.isFavorite;
  saveCards(cards);
  renderCards();
}

// ✅ 排序選項變更時重新渲染
sortSelect.addEventListener("change", renderCards);

// ✅ 初始載入畫面
renderCards();
