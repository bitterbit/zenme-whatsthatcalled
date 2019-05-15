import wikiPage from '../third_party/wikipage'
import han from '../third_party/han.js'

export default async function getEntry(engTitle) {
    let page, lang;
    try {
        page = wikiPage(engTitle);
    } catch {
        throw new Error("Could not find page \"" + engTitle + "\"");
    }
    
    try {
        lang = await page.lang("zh");
    } catch {
        throw new Error("Page \""+engTitle + "\" has no translation to chinese");
    }
    
    const img = "https://logo.clearbit.com/" + removeStr(removeStr(engTitle, " "), "'") + ".com?size=300"
    const pinyin = han(lang.title).map(ch => ch[0]).join(" ");

    return {
        origin: page.getTitle(),
        title: lang.title,
        subtitle: pinyin,
        img: img
    };

    // throw new Error("...");
}

function removeStr(str, s){
    return str.split(s).join("")
}