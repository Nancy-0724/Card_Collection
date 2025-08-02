// 取得 HTML 中的各項 DOM 元素
const form = document.getElementById("cardForm");
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
          "https://script.google.com/macros/s/AKfycbx3Wb6bh_4JxkV0l1OkJ0fqvEOuT82IUq5-EUF35xB6se4YsmMv4LaY88v4wqBlDc4/exec",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
            redirect: "follow"
          }
        );

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

// ✅ 表單送出處理
form.addEventListener("submit", async (e) => {
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

  const cards = getCards();
  cards.push(card);
  saveCards(cards);
  renderCards();
  form.reset();
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
    favBtn.textContent = card.isFavorite ? "取消收藏" : "加入收藏";
    favBtn.onclick = () => toggleFavorite(card.id);

    const editBtn = document.createElement("button");
    editBtn.textContent = "編輯";
    editBtn.onclick = () => {
      info.innerHTML = "";

      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = card.title;

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = card.date;

      const priceInput = document.createElement("input");
      priceInput.type = "number";
      priceInput.min = "0";
      priceInput.value = card.price;

      const noteInput = document.createElement("textarea");
      noteInput.rows = 2;
      noteInput.value = card.note;

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "儲存";
      saveBtn.onclick = () => {
        card.title = titleInput.value;
        card.date = dateInput.value;
        card.price = Number(priceInput.value);
        card.note = noteInput.value;
        saveCards(getCards().map(c => c.id === card.id ? card : c));
        renderCards();
      };

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "取消";
      cancelBtn.onclick = () => renderCards();

      info.appendChild(titleInput);
      info.appendChild(dateInput);
      info.appendChild(priceInput);
      info.appendChild(noteInput);
      info.appendChild(saveBtn);
      info.appendChild(cancelBtn);
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "刪除";
    delBtn.onclick = () => deleteCard(card.id);

    info.appendChild(title);
    info.appendChild(document.createElement("br"));
    info.appendChild(meta);
    info.appendChild(note);
    info.appendChild(favBtn);
    info.appendChild(editBtn);
    info.appendChild(delBtn);

    div.appendChild(img);
    div.appendChild(info);
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
