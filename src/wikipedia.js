
export async function getWikipediaEntry(entry) {
    const url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=info|langlinks&lllang=zh&titles=`+entry;
    const res = await fetch(url);
    const j = await res.json();
    if (res.ok) {
        const pages = j.query.pages;
        const key = Object.keys(pages)[0];
        const title = pages[key].langlinks[0]["*"];
        return title;
    }
    throw new Error("Could'nt fetch from wikipedia");
}