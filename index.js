main();

async function main() {
  const [jasmines, jests] = await Promise.all([parseJasmine(), parseJest()]);
  [jasmines, jests].forEach(mutateSorted);
  createTable({jasmines, jests});
}

async function parseJasmine() {
  const results = await Promise.all(
    [
      "https://jasmine.github.io/api/edge/matchers.html",
      "https://jasmine.github.io/api/edge/async-matchers.html",
    ].map(async (url) => {
      const response = await fetch(url);
      const domParser = new DOMParser();
      const dom = domParser.parseFromString(
        await response.text(),
        response.headers.get("content-type").split(";").shift()
      );
      return [...dom.querySelectorAll("h4.name")].map(({id, textContent}) => ({
        id,
        textContent,
        url,
      }));
    })
  );
  return [].concat(...results);
}

async function parseJest() {
  const url = "https://jestjs.io/docs/en/expect#methods";
  const response = await fetch(url);
  const domParser = new DOMParser();
  const dom = domParser.parseFromString(
    await response.text(),
    response.headers.get("content-type").split(";").shift()
  );
  const ul = dom.getElementById("methods").parentElement.nextElementSibling;
  return [...ul.querySelectorAll("li")]
    .filter(({textContent}) => !textContent.startsWith("expect"))
    .map((li) => {
      const {textContent} = li;
      const {href} = li.querySelector("a");
      return {
        id: href.split("#").pop(),
        textContent: textContent.replace(/^\./, ""),
        url,
      };
    });
}

function mutateSorted(data) {
  return data.sort((a, b) =>
    a.textContent
      .replace(/^\(async\)\s+/, "")
      .localeCompare(b.textContent.replace(/^\(async\)\s+/, ""))
  );
}

function createTable({jasmines, jests}) {
  const table = document.createElement("table");
  table.style.cssText = `
    text-align: left;
  `;
  createThead({table});
  createTbody({jasmines, jests, table});
  document.body.appendChild(table);
}

function createThead({table}) {
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  ["jasmines", "jests"].forEach((title) => {
    const th = document.createElement("th");
    th.textContent = title;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);
}

function createTbody({jasmines, jests, table}) {
  const tbody = document.createElement("tbody");
  while (jasmines.length || jests.length) {
    const tr = document.createElement("tr");
    [jasmines.shift(), jests.shift()].forEach(({id, textContent, url} = {}) => {
      const td = document.createElement("td");
      const anchor = document.createElement("a");
      anchor.href = new URL(`#${id}`, url);
      anchor.target = "_blank";
      anchor.textContent = textContent;
      anchor.style.cssText = `
        display: block;
        padding-right: 1em;
        color: midnightblue;
      `;
      Object.assign(anchor, {
        onmouseenter: onMouseenterAnchor,
        onmouseleave: onMouseleaveAnchor,
      });
      td.appendChild(anchor);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}

function onMouseenterAnchor(event) {
  paintBackground(event, "pink");
}

function onMouseleaveAnchor(event) {
  paintBackground(event, "transparent");
}

function paintBackground(event, backgroundColor) {
  const replaceArguments = [/\([^)]+\)|\s/g, ""];
  const name = event.currentTarget.textContent.replace(...replaceArguments);
  [...document.querySelectorAll("a")]
    .filter(
      ({textContent}) => textContent.replace(...replaceArguments) === name
    )
    .forEach(({parentElement}) =>
      Object.assign(parentElement.style, {backgroundColor})
    );
}
