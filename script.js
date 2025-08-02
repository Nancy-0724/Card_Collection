const form = document.getElementById("cardForm");
const imageInput = document.getElementById("imageInput");
const cardList = document.getElementById("cardList");
const sortSelect = document.getElementById("sortSelect");

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxUsojxUScoSM1pXp7F0_MPATBQM8tcjHPmtq5xzywjEo3Lmn_PTGn0lj9B8QxzpVU36A/exec"; // 請替換

async function uploadToDrive(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      const formData = new URLSearchParams();
      formData.append("action", "upload");
      formData.append("image", base64Image);
      formData.append("filename", file.name);

      try {
        const res = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
        const data = await res.json();
        resolve(data.success ? data.url : null);
      } catch (err) {
        alert("圖片上傳錯誤：" + err.message);
        resolve(null);
      }
    };
    reader.readAsDataURL(file);
  });
}

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

  await sendToServer("saveCard", card);
  await renderCards();
  form.reset();
});

async function sendToServer(action, data) {
  const formData = new URLSearchParams();
  formData.append("action", action);
  for (const key in data) {
    formData.append(key, data[key]);
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
    return await res.json();
  } catch (err) {
    alert("伺服器錯誤：" + err.message);
    return { success: false };
  }
}

async function fetchCards() {
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    return await res.json();
  } catch (err) {
    alert("讀取資料失敗：" + err.message);
    return [];
  }
}

async function renderCards() {
  cardList.innerHTML = "";
  let cards = await fetchCards();

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
    favBtn.onclick = async () => {
      await sendToServer("toggleFavorite", {
        id: card.id,
        isFavorite: (!card.isFavorite).toString()
      });
      await renderCards();
    };

    const editBtn = document.createElement("button");
    editBtn.textContent = "編輯";
    editBtn.onclick = () => {
      info.innerHTML = "";

      const titleInput = createInput("text", card.title);
      const dateInput = createInput("date", card.date);
      const priceInput = createInput("number", card.price);
      const noteInput = document.createElement("textarea");
      noteInput.rows = 2;
      noteInput.value = card.note;

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "儲存";
      saveBtn.onclick = async () => {
        card.title = titleInput.value;
        card.date = dateInput.value;
        card.price = Number(priceInput.value);
        card.note = noteInput.value;
        await sendToServer("updateCard", card);
        await renderCards();
      };

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "取消";
      cancelBtn.onclick = renderCards;

      info.appendChild(createLabeledField("標題", titleInput));
      info.appendChild(createLabeledField("日期", dateInput));
      info.appendChild(createLabeledField("價格", priceInput));
      info.appendChild(createLabeledField("備註", noteInput));
      info.appendChild(saveBtn);
      info.appendChild(cancelBtn);
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "刪除";
    delBtn.onclick = async () => {
      if (confirm("確定要刪除這張卡片嗎？")) {
        await sendToServer("deleteCard", { id: card.id });
        await renderCards();
      }
    };

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

function createInput(type, value) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  return input;
}

function createLabeledField(labelText, inputElement) {
  const wrapper = document.createElement("div");
  wrapper.style.marginBottom = "8px";
  const label = document.createElement("label");
  label.textContent = labelText;
  label.style.display = "block";
  label.style.fontWeight = "bold";
  wrapper.appendChild(label);
  wrapper.appendChild(inputElement);
  return wrapper;
}

sortSelect.addEventListener("change", renderCards);
renderCards();
