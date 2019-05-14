import {api, parseContent} from './wikiapi.js';

const getFileName = text => {
	if (!text) return undefined;
	if (text.indexOf(':') !== -1) {
		const [, name] = text.split(':');
		return name;
	}
	return text;
};


function log(obj){
    console.log(obj);
    return obj;
}

const defaultOptions = {
	apiUrl: 'http://en.wikipedia.org/w/api.php',
	origin: '*'
};

/**
 * WikiPage
 * @namespace WikiPage
 */
export default function wikiPage(title, apiOptions=defaultOptions) {
    const raw = {};
    raw.title = title;

	/**
	 * Structured content from page
	 * @example
	 * wiki.page('batman').then(page => page.content()).then(console.log);
	 * @method WikiPage#content
	 * @return {Promise}
	 */
	function content() {
		return rawContent().then(parseContent);
	}

	/**
	 * Raw content from page
	 * @example
	 * wiki.page('batman').then(page => page.rawContent()).then(console.log);
	 * @method WikiPage#rawContent
	 * @return {Promise}
	 */
	function rawContent() {
		return api(apiOptions, {
			prop: 'extracts',
			explaintext: '',
			titles: raw.title
        }).then(updatePageId)
        .then(res => res.json().query.pages[raw.pageid].extract);
	}

	/**
	 * Text summary from page
	 * @example
	 * wiki.page('batman').then(page => page.summary()).then(console.log);
	 * @method WikiPage#summary
	 * @return {Promise}
	 */
	function summary() {
		return api(apiOptions, {
			prop: 'extracts',
			explaintext: '',    
			exintro: '',
			titles: raw.title
        }).then(log).then(updatePageId)
        .then(res => res.query.pages[raw.pageid].extract);
    }

   

	/**
	 * Raw data from images from page
	 * @example
	 * wiki.page('batman').then(page => page.rawImages()).then(console.log);
	 * @method WikiPage#rawImages
	 * @return {Promise}
	 */
	function rawImages() {
		return api(apiOptions, {
			generator: 'images',
			gimlimit: 'max',
			prop: 'imageinfo',
			iiprop: 'url',
			titles: raw.title
		}).then(res => {
			if (res.query) {
				return Object.keys(res.query.pages).map(id => res.query.pages[id]);
			}
			return [];
		});
	}

	/**
	 * Image URL's from page
	 * @example
	 * wiki.page('batman').then(page => page.image()).then(console.log);
	 * @method WikiPage#images
	 * @return {Promise}
	 */
	function images() {
		return rawImages().then(images => {
            return images
                .filter(image => image.pageid == undefined ? undefined : image) // keep only page specific images
                .map(image => image.imageinfo)
                .reduce((imageInfos, list) => [...imageInfos, ...list], [])
				.map(info => info.url);
		});
	}

    async function lang(lang) {
        const l = await langlinks(lang);
        if (Object.keys(l).length > 0){
            return l[0];
        }
        return {};
    }

	/**
	 * Get list of links to different translations
	 * @method WikiPage#langlinks
	 * @return {Promise} - includes link objects { lang, title }
	 */
	function langlinks(lang = "*") {
        let params = {
			prop: 'langlinks',
			lllimit: 'max',
			titles: raw.title
        };
        if (lang != "*") {
            params.lllang = lang;
        }

		return api(apiOptions, params).then(updatePageId)
        .then(res =>
			res.query.pages[raw.pageid].langlinks.map(link => {
				return {
					lang: link.lang,
					title: link['*']
				};
			})
		);
    }
    
    function updatePageId(res){
        const pagesIds = Object.keys(res.query.pages);
        if (pagesIds.length > 0){
            raw.pageid = pagesIds[0];
        } else {
            console.log("Warning: no page in response...", res);
        }
    
        return res;
    }    

	const page = {
		summary,
        images,
        rawImages,
        langlinks,
        lang
	};

	return page;
}
