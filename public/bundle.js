
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

	let current_component;

	function set_current_component(component) {
		current_component = component;
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

	function add_render_callback(fn) {
		render_callbacks.push(fn);
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

	/* src/App.svelte generated by Svelte v3.2.2 */

	const file = "src/App.svelte";

	// (63:2) {:catch error}
	function create_catch_block(ctx) {
		var p, t0, t1_value = ctx.error, t1;

		return {
			c: function create() {
				p = element("p");
				t0 = text("Error ");
				t1 = text(t1_value);
				add_location(p, file, 63, 2, 1440);
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

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (61:2) {:then entry}
	function create_then_block(ctx) {
		var h1, t_value = ctx.entry, t;

		return {
			c: function create() {
				h1 = element("h1");
				t = text(t_value);
				add_location(h1, file, 61, 2, 1404);
			},

			m: function mount(target, anchor) {
				insert(target, h1, anchor);
				append(h1, t);
			},

			p: function update(changed, ctx) {
				if ((changed.wikiEntry) && t_value !== (t_value = ctx.entry)) {
					set_data(t, t_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h1);
				}
			}
		};
	}

	// (59:20)    <code>loading...</code>   {:then entry}
	function create_pending_block(ctx) {
		var code;

		return {
			c: function create() {
				code = element("code");
				code.textContent = "loading...";
				add_location(code, file, 59, 2, 1362);
			},

			m: function mount(target, anchor) {
				insert(target, code, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(code);
				}
			}
		};
	}

	function create_fragment(ctx) {
		var div1, h1, t1, span0, t2, t3, button, t5, span1, t6, br, t7, span2, t9, input, t10, div0, promise, dispose;

		let info = {
			ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'entry',
			error: 'error'
		};

		handle_promise(promise = ctx.wikiEntry, info);

		return {
			c: function create() {
				div1 = element("div");
				h1 = element("h1");
				h1.textContent = "Translate!";
				t1 = space();
				span0 = element("span");
				t2 = text(ctx.lang_from);
				t3 = space();
				button = element("button");
				button.textContent = "Switch";
				t5 = space();
				span1 = element("span");
				t6 = text(ctx.lang_to);
				br = element("br");
				t7 = space();
				span2 = element("span");
				span2.textContent = "Word";
				t9 = space();
				input = element("input");
				t10 = space();
				div0 = element("div");

				info.block.c();
				add_location(h1, file, 52, 1, 1118);
				add_location(span0, file, 53, 1, 1139);
				add_location(button, file, 54, 1, 1165);
				add_location(span1, file, 55, 1, 1212);
				add_location(br, file, 55, 23, 1234);
				add_location(span2, file, 56, 1, 1240);
				attr(input, "type", "text");
				add_location(input, file, 56, 19, 1258);
				add_location(div0, file, 57, 1, 1333);
				add_location(div1, file, 51, 0, 1111);

				dispose = [
					listen(button, "click", ctx.toggleMode),
					listen(input, "input", ctx.input_input_handler),
					listen(input, "change", ctx.onTranslateChange)
				];
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, h1);
				append(div1, t1);
				append(div1, span0);
				append(span0, t2);
				append(div1, t3);
				append(div1, button);
				append(div1, t5);
				append(div1, span1);
				append(span1, t6);
				append(div1, br);
				append(div1, t7);
				append(div1, span2);
				append(div1, t9);
				append(div1, input);

				input.value = ctx.toTranslate;

				append(div1, t10);
				append(div1, div0);

				info.block.m(div0, info.anchor = null);
				info.mount = () => div0;
				info.anchor = null;
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				if (changed.lang_from) {
					set_data(t2, ctx.lang_from);
				}

				if (changed.lang_to) {
					set_data(t6, ctx.lang_to);
				}

				if (changed.toTranslate && (input.value !== ctx.toTranslate)) input.value = ctx.toTranslate;
				info.ctx = ctx;

				if (('wikiEntry' in changed) && promise !== (promise = ctx.wikiEntry) && handle_promise(promise, info)) ; else {
					info.block.p(changed, assign(assign({}, ctx), info.resolved));
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}

				info.block.d();
				info = null;

				run_all(dispose);
			}
		};
	}

	let MODE_CHN_ENG = 1;

	async function getDummyWikipediaEntry() {
		return "Type to find out...";
	}

	function instance($$self, $$props, $$invalidate) {
		
		let mode = MODE_CHN_ENG;
		let toTranslate = "";
		let wikiEntry = getDummyWikipediaEntry();
		
		var log="...";
		
		let lang_from, lang_to = "";
		updateModeString();
		
		function updateModeString() {
			if (mode == MODE_CHN_ENG) {
				$$invalidate('lang_from', lang_from = "CHN");
				$$invalidate('lang_to', lang_to = "ENG");
				return;
			}
			$$invalidate('lang_from', lang_from = "ENG");
			$$invalidate('lang_to', lang_to = "CHN");
		}
		
		function toggleMode() {
			$$invalidate('mode', mode = (mode+1) % 2);
			updateModeString();
		}
		
		function onTranslateChange() {
			$$invalidate('wikiEntry', wikiEntry = getWikipediaEntry(toTranslate));
		}
		
		async function getWikipediaEntry(entry) {
			const url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=info|langlinks&lllang=zh&titles=`+entry;
			$$invalidate('log', log = url);
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

		function input_input_handler() {
			toTranslate = this.value;
			$$invalidate('toTranslate', toTranslate);
		}

		return {
			toTranslate,
			wikiEntry,
			lang_from,
			lang_to,
			toggleMode,
			onTranslateChange,
			input_input_handler
		};
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, []);
		}
	}

	var app = new App({
		target: document.body
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
