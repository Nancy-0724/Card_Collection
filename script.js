const form = document.getElementById("cardForm");
const imageInput = document.getElementById("imageInput");
const cardList = document.getElementById("cardList");
const sortSelect = document.getElementById("sortSelect");

// ✅ 替換成你的 Apps Script URL（不加 ?action）
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzcmPE_S3_yAfxalXXnfMuhZEX1S0ZI0sZMn5opQ9BB7e8iMn0BJKnUExKNYN2fU2-D/exec";

// ✅ 上傳圖片到 Google Drive
async function uploadToDrive(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      const formData = new URLSearchParams();
      formData.append("image", base64Image);
      formData.append("filename", file.name);
      formData.append("action", "upload");

      try {
        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
        const data = await res.json();
        if (data.success) {
          resolve(data.url);
        } else {
          alert("圖片上傳失敗：" + data.message);
          resolve(null);
        }
      } catch (err) {
        alert("連線錯誤：" + err.message);
        resolve(null);
      }
    };
    reader.readAsDataURL(file);
  });
}

// ✅ 儲存卡片資料到 Google Sheet
async function saveCardToSheet(card) {
  const formData = new URLSearchParams();
  for (const key in card) {
    formData.append(key, card[key]);
  }
  formData.append("action", "saveCard");

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    const data = await res.json();
    if (!data.success) {
      alert("資料儲存失敗：" + data.message);
    }
  } catch (err) {
    alert("連線失敗：" + err.message);
  }
}

// ✅ 載入所有卡片（GET）
async function fetchCardsFromSheet() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    const cards = await res.json();
    return cards;
  } catch (err) {
    alert("讀取卡片資料失敗：" + err.message);
    return [];
  }
}

// ✅ 表單送出處理
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = imageInput.files[0];
  if (!file) return alert("請選擇圖片");

  const imageUrl = await uploadToDrive(file);
  if (!imageUrl) return;

  const card = {
    id: Date.now().toString(),
    title: document.getElementById("titleInput").value,
    note: document.getElementById("noteInput").value,
    date: document.getElementById("dateInput").value,
    price: Number(document.getElementById("priceInput").value),
    imageUrl,
    isFavorite: false
  };

  await saveCardToSheet(card);
  await renderCards();
  form.reset();
});

// ✅ 顯示所有卡片
async function renderCards() {
  cardList.innerHTML = "";
  let cards = await fetchCardsFromSheet();

  const sort = sortSelect.value;
  if (sort === "price-asc") cards.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") cards.sort((a, b) => b.price - a.price);
  if (sort === "date-asc") cards.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sort === "date-desc") cards.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const card of cards) {
    const div = document.createElement("div");
    div.className = "card";

    const img = document.createElement("img");
    img.src = card.imageUrl;
    img.alt = "小卡圖片";
    img.referrerPolicy = "no-referrer";
    img.onerror = function () {
      this.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/100px-No_image_available.svg.png";
    };

    const info = document.createElement("div");
    info.className = "card-info";

    const title = document.createElement("strong");
    title.textContent = card.title + (card.isFavorite ? " ⭐" : "");
    const meta = document.createElement("small");
    meta.textContent = `${card.date} | ${card.price} 元`;
    const note = document.createElement("p");
    note.textContent = card.note;

    const favBtn = document.createElement("button");
    favBtn.textContent = "加入收藏 (僅前端)";
    favBtn.onclick = () => {
      alert("此版本收藏功能為前端模擬，未寫入雲端。");
    };

    info.appendChild(title);
    info.appendChild(document.createElement("br"));
    info.appendChild(meta);
    info.appendChild(note);
    info.appendChild(favBtn);
    div.appendChild(img);
    div.appendChild(info);
    cardList.appendChild(div);
  }
}

// ✅ 排序選項變更時重新渲染
sortSelect.addEventListener("change", renderCards);

// ✅ 初始載入
renderCards();
