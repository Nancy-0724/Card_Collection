// ...原本的程式碼皆維持...

async function renderCards() {
  cardList.innerHTML = "";
  let cards = await fetchCards();

  const currentCategory = filterCategory.value;

  // 分類統計與更新選單
  const categoryCount = {};
  const seenCategories = new Set();
  for (const c of cards) {
    const key = c.category || "未分類";
    categoryCount[key] = (categoryCount[key] || 0) + 1;
    seenCategories.add(key);
  }

  const uniqueCategories = Array.from(seenCategories);
  filterCategory.innerHTML = `<option value="">全部分類</option>
    <option value="__favorite__">⭐ 已收藏</option>` +
    uniqueCategories.map(cat =>
      <option value="${cat}">${cat} (${categoryCount[cat]})</option>
    ).join("");
  filterCategory.value = currentCategory;

  // 更新 datalist 內容
  const categoryOptions = document.getElementById("categoryOptions");
  categoryOptions.innerHTML = uniqueCategories.map(cat =>
    <option value="${cat}"></option>
  ).join("");

  // 篩選
  if (currentCategory === "__favorite__") {
    cards = cards.filter(c => c.isFavorite);
  } else if (currentCategory) {
    cards = cards.filter(c => (c.category || "未分類") === currentCategory);
  }

  // 排序
  const sort = sortSelect.value;
  if (sort === "price-asc") cards.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") cards.sort((a, b) => b.price - a.price);
  if (sort === "date-asc") cards.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sort === "date-desc") cards.sort((a, b) => new Date(b.date) - new Date(a.date));

  let total = 0;

  for (const card of cards) {
    total += card.price;

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

    const metaDate = document.createElement("small");
    metaDate.textContent = `日期：${formatDateToLocalYMD(card.date)}`;

    const metaPrice = document.createElement("small");
    metaPrice.textContent = `價格：${card.price} 元`;

    const categoryName = card.category || "未分類";
    const metaCategory = document.createElement("small");
    metaCategory.textContent = categoryName;
    metaCategory.className = "category-label";
    metaCategory.style.backgroundColor = getColorForCategory(categoryName);

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
      const dateInput = createInput("date", formatDateToLocalYMD(card.date));
      const priceInput = createInput("number", card.price);
      const categoryInput = createInput("text", card.category);
      const noteInput = document.createElement("textarea");
      noteInput.rows = 2;
      noteInput.value = card.note;

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "儲存";
      saveBtn.onclick = async () => {
        card.title = titleInput.value;
        card.date = dateInput.value;
        card.price = Number(priceInput.value);
        card.category = categoryInput.value || "未分類";
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
      info.appendChild(createLabeledField("分類", categoryInput));
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
    info.appendChild(metaDate);
    info.appendChild(document.createElement("br"));
    info.appendChild(metaPrice);
    info.appendChild(document.createElement("br"));
    info.appendChild(metaCategory);
    info.appendChild(note);
    info.appendChild(favBtn);
    info.appendChild(editBtn);
    info.appendChild(delBtn);

    div.appendChild(img);
    div.appendChild(info);
    cardList.appendChild(div);
  }

  // ✅ 修改這一行
  document.getElementById("totalAmount").textContent =
    `總金額：${total} 元（共 ${cards.length} 張卡片）`;
}
