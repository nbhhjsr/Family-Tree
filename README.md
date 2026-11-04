# 🌸 Bee's Family Roots

**ITT588 Front-End Technology – Lab Work 4: Interactive Family Tree Web Application**
By **Nurul Nabihah binti Jasri**

🔗 **Live demo:** https://nbhhjsr.github.io/Family-Tree/

---

## 📖 Introduction

Family records preserve our identity, relationships and history across generations. This project is an
interactive family tree web application that turns a simple JSON dataset into a visual tree. It shows
parents, spouses, children and siblings across three generations of my own family, using a cute soft yellow
and soft pink theme. Every person has a birth date and a zodiac sign, which is calculated automatically
from the birth date.

The page is built with HTML, CSS and JavaScript only. The data is retrieved from a JSON file with
JavaScript, then the tree, member cards and statistics are created dynamically in the browser, and the layout is responsive.

## 🎯 Objectives

1. To retrieve and process family heritage data from a JSON dataset using JavaScript.
2. To apply JavaScript to display family member information and relationships dynamically on a web page.
3. To develop a responsive front-end application that visualises family relationships, including parents, spouses and children, using HTML, CSS and JavaScript.
4. To implement data filtering and navigation features to explore family heritage information.

## ✨ Features

- **Tree view:** parents at the top (the roots), couples joined by 💕, children branching below
- **Pop-up card:** tap a name to see the birth date, zodiac, parents, spouse, children and siblings (all clickable)
- **Filters:** search by name, gender, generation and zodiac sign
- **Members page:** all family members as cards
- **Stats page:** number of people per generation and a zodiac chart
- **Generation names:** 🌱 Roots, 🌿 Branches, 🌸 Blossoms
- **Navigation:** Back/Forward buttons work and every person has their own link (for example `#p3`)
- **Error handling:** a friendly message appears if the JSON file is missing or invalid

## 🛠️ Tools Used

| Tool | Purpose |
|------|---------|
| HTML5 | Page structure |
| CSS3 | Theme, layout (Flexbox and Grid), responsive design, animations |
| JavaScript (ES6) | Loading JSON, building the tree, filtering, events |
| JSON | Family dataset (follows the lab sample format) |
| MVC pattern | Separating data (Model), display (View) and logic (Controller) |
| Google Fonts (Fredoka) | Cute rounded font |
| Visual Studio Code + Live Server | Writing code and previewing it live |
| Git and GitHub | Storing the project |
| GitHub Pages | Hosting the live website |

## 🗂️ Project Structure (MVC)

```
family-tree/
├── index.html          ← page layout
├── style.css           ← theme and responsive styling
├── data/
│   └── people.json     ← dataset
└── js/
    ├── model.js        ← Model: loads/validates JSON, relationships, generations, zodiac, filters, stats
    ├── view.js         ← View: tree, members, stats, pop-up card
    └── controller.js   ← Controller: events, state, navigation
```

## ▶️ How to Run

- **Online:** open the live demo link above.
- **On your computer:** download or clone the repository, then double-click `index.html`.
  If the browser blocks the JSON file, use the **Choose data/people.json** button on the page, or open the folder with VS Code **Live Server**.

## ✅ Conclusion

In this lab I built a working family tree web application that reads family data from a JSON file and
displays it dynamically. I learned how to fetch and validate JSON with JavaScript, how to work out relationships
such as children, siblings and generations from `fatherId` and `motherId`, and how to organise code using the
MVC pattern. I also practised responsive CSS, filtering, and URL navigation.

The result shows my family's roots clearly across three generations and meets all the lab objectives.
In the future, I would like to add family photos, more relatives, and a "how are we related?" finder.
