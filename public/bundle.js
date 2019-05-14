
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (const k in src) tar[k] = src[k];
		return tar;
	}

	function is_promise(value) {
		return value && typeof value.then === 'function';
	}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function element(name) {
		return document.createElement(name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function set_style(node, key, value) {
		node.style.setProperty(key, value);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	// TODO figure out if we still want to support
	// shorthand events, or if we want to implement
	// a real bubbling mechanism
	function bubble(component, event) {
		const callbacks = component.$$.callbacks[event.type];

		if (callbacks) {
			callbacks.slice().forEach(fn => fn(event));
		}
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_binding_callback(fn) {
		binding_callbacks.push(fn);
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function handle_promise(promise, info) {
		const token = info.token = {};

		function update(type, index, key, value) {
			if (info.token !== token) return;

			info.resolved = key && { [key]: value };

			const child_ctx = assign(assign({}, info.ctx), info.resolved);
			const block = type && (info.current = type)(child_ctx);

			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach((block, i) => {
						if (i !== index && block) {
							group_outros();
							on_outro(() => {
								block.d(1);
								info.blocks[i] = null;
							});
							block.o(1);
							check_outros();
						}
					});
				} else {
					info.block.d(1);
				}

				block.c();
				if (block.i) block.i(1);
				block.m(info.mount(), info.anchor);

				flush();
			}

			info.block = block;
			if (info.blocks) info.blocks[index] = block;
		}

		if (is_promise(promise)) {
			promise.then(value => {
				update(info.then, 1, info.value, value);
			}, error => {
				update(info.catch, 2, info.error, error);
			});

			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}

			info.resolved = { [info.value]: promise };
		}
	}

	function bind(component, name, callback) {
		if (component.$$.props.indexOf(name) === -1) return;
		component.$$.bound[name] = callback;
		callback(component.$$.ctx[name]);
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	async function getWikipediaEntry(entry) {
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

	/* src/components/searchbar.svelte generated by Svelte v3.2.2 */

	const file = "src/components/searchbar.svelte";

	function create_fragment(ctx) {
		var div, input, input_class_value, dispose;

		return {
			c: function create() {
				div = element("div");
				input = element("input");
				set_style(input, "max-width", "600px");
				input.className = input_class_value = "" + (ctx.hasDefault? 'default_value' : '') + " svelte-ij8vmq";
				attr(input, "type", "text");
				add_location(input, file, 18, 4, 313);
				set_style(div, "text-align", "center");
				add_location(div, file, 17, 0, 276);

				dispose = [
					listen(input, "input", ctx.input_input_handler),
					listen(input, "change", ctx.change_handler),
					listen(input, "focus", ctx.onFocus)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, input);

				input.value = ctx.value;
			},

			p: function update(changed, ctx) {
				if (changed.value && (input.value !== ctx.value)) input.value = ctx.value;

				if ((changed.hasDefault) && input_class_value !== (input_class_value = "" + (ctx.hasDefault? 'default_value' : '') + " svelte-ij8vmq")) {
					input.className = input_class_value;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				run_all(dispose);
			}
		};
	}

	let defaultValue = "McDonald's";

	function instance($$self, $$props, $$invalidate) {
		let { value } = $$props;
	    let hasDefault = true;
	    $$invalidate('value', value = defaultValue);

	    function onFocus(){
	        $$invalidate('value', value = "");
	        $$invalidate('hasDefault', hasDefault = false);
	    }

		function change_handler(event) {
			bubble($$self, event);
		}

		function input_input_handler() {
			value = this.value;
			$$invalidate('value', value);
		}

		$$self.$set = $$props => {
			if ('value' in $$props) $$invalidate('value', value = $$props.value);
		};

		return {
			value,
			hasDefault,
			onFocus,
			change_handler,
			input_input_handler
		};
	}

	class Searchbar extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["value"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.value === undefined && !('value' in props)) {
				console.warn("<Searchbar> was created without expected prop 'value'");
			}
		}

		get value() {
			throw new Error("<Searchbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<Searchbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/resultcard.svelte generated by Svelte v3.2.2 */

	const file$1 = "src/components/resultcard.svelte";

	function create_fragment$1(ctx) {
		var div4, div2, div0, h1, t0, t1, h5, t2, t3, div1, button0, t5, button1, t7, div3;

		return {
			c: function create() {
				div4 = element("div");
				div2 = element("div");
				div0 = element("div");
				h1 = element("h1");
				t0 = text(ctx.title);
				t1 = space();
				h5 = element("h5");
				t2 = text(ctx.subtitle);
				t3 = space();
				div1 = element("div");
				button0 = element("button");
				button0.textContent = "PLAY";
				t5 = space();
				button1 = element("button");
				button1.textContent = "WIKIPEDIA";
				t7 = space();
				div3 = element("div");
				h1.id = "title";
				h1.className = "svelte-15yiszt";
				add_location(h1, file$1, 46, 16, 1233);
				h5.id = "subtitle";
				add_location(h5, file$1, 47, 16, 1277);
				div0.className = "column";
				add_location(div0, file$1, 45, 12, 1196);
				button0.className = "svelte-15yiszt";
				add_location(button0, file$1, 50, 16, 1392);
				button1.className = "svelte-15yiszt";
				add_location(button1, file$1, 51, 16, 1430);
				div1.id = "buttons";
				div1.className = "column svelte-15yiszt";
				add_location(div1, file$1, 49, 12, 1342);
				div2.id = "left";
				div2.className = "column column-60 svelte-15yiszt";
				add_location(div2, file$1, 44, 8, 1143);
				div3.id = "icon";
				set_style(div3, "background-image", "url('" + ctx.img + "')");
				div3.className = "column column-40 svelte-15yiszt";
				add_location(div3, file$1, 54, 8, 1499);
				div4.id = "card";
				div4.className = "row svelte-15yiszt";
				add_location(div4, file$1, 41, 4, 1083);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div4, anchor);
				append(div4, div2);
				append(div2, div0);
				append(div0, h1);
				append(h1, t0);
				append(div0, t1);
				append(div0, h5);
				append(h5, t2);
				append(div2, t3);
				append(div2, div1);
				append(div1, button0);
				append(div1, t5);
				append(div1, button1);
				append(div4, t7);
				append(div4, div3);
			},

			p: function update(changed, ctx) {
				if (changed.title) {
					set_data(t0, ctx.title);
				}

				if (changed.subtitle) {
					set_data(t2, ctx.subtitle);
				}

				if (changed.img) {
					set_style(div3, "background-image", "url('" + ctx.img + "')");
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div4);
				}
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { title, subtitle, img, wikiLink } = $$props;
	    // TODO on play

		$$self.$set = $$props => {
			if ('title' in $$props) $$invalidate('title', title = $$props.title);
			if ('subtitle' in $$props) $$invalidate('subtitle', subtitle = $$props.subtitle);
			if ('img' in $$props) $$invalidate('img', img = $$props.img);
			if ('wikiLink' in $$props) $$invalidate('wikiLink', wikiLink = $$props.wikiLink);
		};

		return { title, subtitle, img, wikiLink };
	}

	class Resultcard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["title", "subtitle", "img", "wikiLink"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.title === undefined && !('title' in props)) {
				console.warn("<Resultcard> was created without expected prop 'title'");
			}
			if (ctx.subtitle === undefined && !('subtitle' in props)) {
				console.warn("<Resultcard> was created without expected prop 'subtitle'");
			}
			if (ctx.img === undefined && !('img' in props)) {
				console.warn("<Resultcard> was created without expected prop 'img'");
			}
			if (ctx.wikiLink === undefined && !('wikiLink' in props)) {
				console.warn("<Resultcard> was created without expected prop 'wikiLink'");
			}
		}

		get title() {
			throw new Error("<Resultcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set title(value) {
			throw new Error("<Resultcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get subtitle() {
			throw new Error("<Resultcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set subtitle(value) {
			throw new Error("<Resultcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get img() {
			throw new Error("<Resultcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set img(value) {
			throw new Error("<Resultcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get wikiLink() {
			throw new Error("<Resultcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set wikiLink(value) {
			throw new Error("<Resultcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/historycard.svelte generated by Svelte v3.2.2 */

	const file$2 = "src/components/historycard.svelte";

	function create_fragment$2(ctx) {
		var div2, div0, h2, t0, t1, h5, t2, t3, span, t4, div1, h1, t5;

		return {
			c: function create() {
				div2 = element("div");
				div0 = element("div");
				h2 = element("h2");
				t0 = text(ctx.zhTitle);
				t1 = space();
				h5 = element("h5");
				t2 = text(ctx.zhSubtitle);
				t3 = space();
				span = element("span");
				t4 = space();
				div1 = element("div");
				h1 = element("h1");
				t5 = text(ctx.engTitle);
				set_style(h2, "margin-bottom", "-5px");
				add_location(h2, file$2, 30, 8, 619);
				add_location(h5, file$2, 31, 8, 675);
				div0.className = "column column-40";
				add_location(div0, file$2, 29, 4, 580);
				span.id = "seperator";
				span.className = "svelte-3qmtqo";
				add_location(span, file$2, 33, 4, 712);
				h1.className = "svelte-3qmtqo";
				add_location(h1, file$2, 35, 8, 810);
				div1.className = "column column-60";
				set_style(div1, "text-align", "right");
				add_location(div1, file$2, 34, 4, 745);
				div2.id = "card";
				div2.className = "row svelte-3qmtqo";
				add_location(div2, file$2, 28, 0, 548);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div2, anchor);
				append(div2, div0);
				append(div0, h2);
				append(h2, t0);
				append(div0, t1);
				append(div0, h5);
				append(h5, t2);
				append(div2, t3);
				append(div2, span);
				append(div2, t4);
				append(div2, div1);
				append(div1, h1);
				append(h1, t5);
			},

			p: function update(changed, ctx) {
				if (changed.zhTitle) {
					set_data(t0, ctx.zhTitle);
				}

				if (changed.zhSubtitle) {
					set_data(t2, ctx.zhSubtitle);
				}

				if (changed.engTitle) {
					set_data(t5, ctx.engTitle);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div2);
				}
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { engTitle, zhTitle, zhSubtitle } = $$props;

		$$self.$set = $$props => {
			if ('engTitle' in $$props) $$invalidate('engTitle', engTitle = $$props.engTitle);
			if ('zhTitle' in $$props) $$invalidate('zhTitle', zhTitle = $$props.zhTitle);
			if ('zhSubtitle' in $$props) $$invalidate('zhSubtitle', zhSubtitle = $$props.zhSubtitle);
		};

		return { engTitle, zhTitle, zhSubtitle };
	}

	class Historycard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, ["engTitle", "zhTitle", "zhSubtitle"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.engTitle === undefined && !('engTitle' in props)) {
				console.warn("<Historycard> was created without expected prop 'engTitle'");
			}
			if (ctx.zhTitle === undefined && !('zhTitle' in props)) {
				console.warn("<Historycard> was created without expected prop 'zhTitle'");
			}
			if (ctx.zhSubtitle === undefined && !('zhSubtitle' in props)) {
				console.warn("<Historycard> was created without expected prop 'zhSubtitle'");
			}
		}

		get engTitle() {
			throw new Error("<Historycard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set engTitle(value) {
			throw new Error("<Historycard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get zhTitle() {
			throw new Error("<Historycard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set zhTitle(value) {
			throw new Error("<Historycard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get zhSubtitle() {
			throw new Error("<Historycard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set zhSubtitle(value) {
			throw new Error("<Historycard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.2.2 */

	const file$3 = "src/App.svelte";

	// (32:2) {:catch error}
	function create_catch_block(ctx) {
		var p, t0, t1_value = ctx.error, t1;

		return {
			c: function create() {
				p = element("p");
				t0 = text("Error ");
				t1 = text(t1_value);
				add_location(p, file$3, 32, 2, 990);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
				append(p, t0);
				append(p, t1);
			},

			p: function update(changed, ctx) {
				if ((changed.wikiEntry) && t1_value !== (t1_value = ctx.error)) {
					set_data(t1, t1_value);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (30:2) {:then entry}
	function create_then_block(ctx) {
		var current;

		var resultcard = new Resultcard({
			props: {
			title: ctx.entry,
			subtitle: subtitle,
			img: img
		},
			$$inline: true
		});

		return {
			c: function create() {
				resultcard.$$.fragment.c();
			},

			m: function mount(target, anchor) {
				mount_component(resultcard, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var resultcard_changes = {};
				if (changed.wikiEntry) resultcard_changes.title = ctx.entry;
				if (changed.subtitle) resultcard_changes.subtitle = subtitle;
				if (changed.img) resultcard_changes.img = img;
				resultcard.$set(resultcard_changes);
			},

			i: function intro(local) {
				if (current) return;
				resultcard.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				resultcard.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				resultcard.$destroy(detaching);
			}
		};
	}

	// (28:20)    <code>loading...</code>   {:then entry}
	function create_pending_block(ctx) {
		var code;

		return {
			c: function create() {
				code = element("code");
				code.textContent = "loading...";
				add_location(code, file$3, 28, 2, 871);
			},

			m: function mount(target, anchor) {
				insert(target, code, anchor);
			},

			p: noop,
			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(code);
				}
			}
		};
	}

	function create_fragment$3(ctx) {
		var div1, h1, t1, updating_value, t2, div0, promise, t3, br, t4, current;

		function searchbar_value_binding(value) {
			ctx.searchbar_value_binding.call(null, value);
			updating_value = true;
			add_flush_callback(() => updating_value = false);
		}

		let searchbar_props = {};
		if (ctx.toTranslate !== void 0) {
			searchbar_props.value = ctx.toTranslate;
		}
		var searchbar = new Searchbar({ props: searchbar_props, $$inline: true });

		add_binding_callback(() => bind(searchbar, 'value', searchbar_value_binding));
		searchbar.$on("change", ctx.onTranslateChange);

		let info = {
			ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'entry',
			error: 'error',
			blocks: Array(3)
		};

		handle_promise(promise = ctx.wikiEntry, info);

		var historycard = new Historycard({
			props: {
			engTitle: "McDonald's",
			zhTitle: "麦当劳",
			zhSubtitle: "màidāngláo"
		},
			$$inline: true
		});

		return {
			c: function create() {
				div1 = element("div");
				h1 = element("h1");
				h1.textContent = "ZenMeShuo?!";
				t1 = space();
				searchbar.$$.fragment.c();
				t2 = space();
				div0 = element("div");

				info.block.c();

				t3 = space();
				br = element("br");
				t4 = space();
				historycard.$$.fragment.c();
				set_style(h1, "text-align", "center");
				add_location(h1, file$3, 23, 1, 723);
				add_location(div0, file$3, 26, 1, 842);
				add_location(br, file$3, 35, 1, 1031);
				div1.className = "container";
				attr(div1, "align", "center");
				add_location(div1, file$3, 22, 0, 683);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, h1);
				append(div1, t1);
				mount_component(searchbar, div1, null);
				append(div1, t2);
				append(div1, div0);

				info.block.m(div0, info.anchor = null);
				info.mount = () => div0;
				info.anchor = null;

				append(div1, t3);
				append(div1, br);
				append(div1, t4);
				mount_component(historycard, div1, null);
				current = true;
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				var searchbar_changes = {};
				if (!updating_value && changed.toTranslate) {
					searchbar_changes.value = ctx.toTranslate;
				}
				searchbar.$set(searchbar_changes);

				info.ctx = ctx;

				if (('wikiEntry' in changed) && promise !== (promise = ctx.wikiEntry) && handle_promise(promise, info)) ; else {
					info.block.p(changed, assign(assign({}, ctx), info.resolved));
				}
			},

			i: function intro(local) {
				if (current) return;
				searchbar.$$.fragment.i(local);

				info.block.i();

				historycard.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				searchbar.$$.fragment.o(local);

				for (let i = 0; i < 3; i += 1) {
					const block = info.blocks[i];
					if (block) block.o();
				}

				historycard.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				searchbar.$destroy();

				info.block.d();
				info = null;

				historycard.$destroy();
			}
		};
	}

	let subtitle = "màidāngláo";

	let img = "https://www.telegraph.co.uk/content/dam/business/2016/04/23/mcdonalds3_1-xlarge_trans_NvBQzQNjv4Bqek9vKm18v_rkIPH9w2GMNvrBHlngucm5MflHTV9w6vk.jpg";

	async function getDummyWikipediaEntry() {
		return "Type to find out...";
	}

	function instance$3($$self, $$props, $$invalidate) {
		

		let wikiEntry = getDummyWikipediaEntry();
		let toTranslate = "";

		function onTranslateChange() {
			$$invalidate('wikiEntry', wikiEntry = getWikipediaEntry(toTranslate));
		}

		function searchbar_value_binding(value) {
			toTranslate = value;
			$$invalidate('toTranslate', toTranslate);
		}

		return {
			wikiEntry,
			toTranslate,
			onTranslateChange,
			searchbar_value_binding
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
		}
	}

	var app = new App({
		target: document.body
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
