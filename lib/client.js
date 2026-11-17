// dsh-has-stripper -- client bundle (hand-written __ModuleLoader__ factory).
//
// WHY: with :has() rules present, a class change on one element makes Chromium
// re-evaluate :has() matches up the ancestor chain. On a transcript with ~100k
// KaTeX nodes, opening the "/" command menu (22 class writes) then costs several
// hundred milliseconds per keystroke. Measured: deleting every :has() rule
// removes the stall entirely.
//
// WHAT: recursively walk every same-origin stylesheet and delete rules whose
// selectorText contains ":has(". Re-run (debounced) when new <style>/<link>
// nodes appear, because plugins inject their CSS after boot.
//
// VERIFY: window.__hasStripper  ->  { installed: true, removed: N, passes: M }
// DISABLE: window.__hasStripper.stop()

window.__ModuleLoader__.load({
	id: "dsh-has-stripper",
	factory: () => {
		var module = { exports: {} };
		var exports = module.exports;

		const name = "dsh-has-stripper";
		const inject = [];

		let removed = 0;
		let passes = 0;
		let observer = null;
		let timer = null;

		function deleteRule(list, index, sheet, parent) {
			try {
				if (parent && typeof parent.deleteRule === "function") parent.deleteRule(index);
				else sheet.deleteRule(index);
				return true;
			} catch {
				return false;
			}
		}

		function stripList(list, sheet, parent) {
			let count = 0;
			for (let i = list.length - 1; i >= 0; i -= 1) {
				const rule = list[i];
				// grouping rules (@media, @supports, ...) -- recurse first
				if (rule.cssRules && rule.cssRules.length > 0) {
					count += stripList(rule.cssRules, sheet, rule);
					continue;
				}
				const selector = typeof rule.selectorText === "string" ? rule.selectorText : "";
				if (selector.indexOf(":has(") === -1) continue;
				if (deleteRule(list, i, sheet, parent)) count += 1;
			}
			return count;
		}

		function pass() {
			passes += 1;
			let count = 0;
			for (const sheet of Array.from(document.styleSheets)) {
				let rules = null;
				try { rules = sheet.cssRules; } catch { rules = null; }
				if (rules === null || rules.length === 0) continue;
				count += stripList(rules, sheet, null);
			}
			if (count > 0) {
				removed += count;
				console.info("[" + name + "] removed " + count + " :has() rule(s); total " + removed);
			}
			if (observer === null && typeof MutationObserver === "function") {
				observer = new MutationObserver((records) => {
					for (const record of records) {
						for (const node of record.addedNodes) {
							if (node.nodeType !== 1) continue;
							if (node.tagName === "STYLE" || node.tagName === "LINK") { schedule(); return; }
						}
					}
				});
				try { observer.observe(document.head, { childList: true, subtree: true }); } catch {}
			}
		}

		function schedule() {
			if (timer !== null) return;
			timer = setTimeout(() => { timer = null; pass(); }, 120);
		}

		function install() {
			pass();
			// 部分插件在挂载后才注入样式，补两轮
			setTimeout(pass, 400);
			setTimeout(pass, 1500);
			window.__hasStripper = {
				installed: true,
				version: 1,
				get removed() { return removed; },
				get passes() { return passes; },
				run: pass,
				stop() {
					if (observer !== null) { observer.disconnect(); observer = null; }
					if (timer !== null) { clearTimeout(timer); timer = null; }
					delete window.__hasStripper;
				},
			};
		}

		function apply() { install(); }
		install();

		exports.name = name;
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	},
});
