enyo.kind({
	name: "App",
	kind: "FittableColumns",
	fit: true,
	components:[
		{kind:"FittableRows", style:"width:50%;", components: [
			{kind:"onyx.Toolbar", content:"Parent frame"},
			{kind:"Scroller", fit:true, components: [
				{kind:"Repeater", count:30, onSetupItem:"setupItem", ondragstart:"dragStart", ondrop:"drop", ondown:"eventInfo", onup:"eventInfo", components: [
					{style:"border-bottom: 1px solid gray; background:white; padding: 10px;", name:"label"}
				]}
			]},
			{kind:"onyx.Toolbar", components:[{kind:"onyx.Button", content:"Clear", ontap:"clearInfo"}]},
			{kind:"Scroller", style:"height:200px;", name:"info"}
		]},
		{name:"sandbox", fit:true, tag:"iframe", style:"height:100%; width:100%;", src:"iframe.html"}
	],
	rendered: function() {
		this.inherited(arguments);
		this.setupRPC();
		this.setupRemoteEvents();
	},
	setupItem: function(inSender, inEvent) {
		inEvent.item.$.label.setContent("LeftItem" + inEvent.index);
	},
	appendInfo: function(str) {
		this.$.info.createComponent({content:str, allowHtml:true}).render();
	},
	clearInfo: function() {
		this.$.info.destroyClientControls();
	},
	eventInfo: function(inSender, inEvent) {
		this.appendInfo("<b>" + inEvent.type + "</b>");
	},

	// ---- Handle local events -----
	dragStart: function(inSender, inEvent) {
		this.setDragging(inEvent.originator.content);
		this.appendInfo("<b>" + inEvent.type + "</b> from " + this.dragging);
	},
	drop: function(inSender, inEvent) {
		this.appendInfo("<b>" + inEvent.type + "</b> " + this.dragging + " onto " + inEvent.originator.content);
		this.setDragging(null);
	},
	setDragging: function(item, remote) {
		this.dragging = item;
		if (!remote) {
			this.callRemote("setDragging", item, true);
		}
	},

	// ---- Send remote events -----
	setupRemoteEvents: function() {
		enyo.dispatcher.features.push(enyo.bind(this, function(inEvent) {
			var event = {
				clientX: inEvent.clientX,
				clientY: inEvent.clientY,
				which: inEvent.which
			};
			if (inEvent.type == "down") {
				this.callRemote("remoteDown", event);
			} else if (inEvent.type == "up") {
				this.callRemote("remoteUp", event);
			}
		}));
	},

	// ---- Handle remote events -----
	remoteDown: function(inEvent) {
		enyo.gesture.downEvent = inEvent;
		enyo.gesture.drag.dragEvent = inEvent;
		this.appendInfo("remote down");
	},
	remoteUp: function(inEvent) {
		var b = this.$.sandbox.getBounds();
		if ((inEvent.clientX >= 0) && (inEvent.clientX <= b.width) &&
			(inEvent.clientY >= 0) && (inEvent.clientY <= b.height)) {
			enyo.gesture.downEvent = null;
			enyo.gesture.drag.dragEvent = null;
			this.appendInfo("remote up");
		} else {
			// When a drag starts in the iframe but drops in the parent,
			// the "up" is fired into the iframe, not the parent (it's not
			// symmetrical, since a drag from the parent to the iframe causes
			// "up" to fire in the iframe as expected).  So this logic
			// generates a local "up" event (which leads to a local drop)
			// based on the remote up
			inEvent.target = document.elementFromPoint(
				inEvent.clientX + b.left,
				inEvent.clientY + b.top
			);
			enyo.gesture.up(inEvent);
		}
	},

	// ---- RPC functions -----
	setupRPC: function() {
		this.remote = this.$.sandbox.hasNode().contentWindow;
		enyo.dispatcher.listen(window, "message", enyo.bind(this, "handleMessage"));
	},
	handleMessage: function(message) {
		var fn = message.data.fn;
		var args = message.data.args;
		this[fn].apply(this, args);
	},
	callRemote: function() {
		var args = [].slice.call(arguments);
		var fn = args.shift();
		this.remote.postMessage({fn:fn, args:args}, "*");
	}
});
