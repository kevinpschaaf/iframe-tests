enyo.kind({
	name: "App",
	fit: true,
	components:[
		{kind: "FittableRows", classes:"enyo-fit", components: [
			{kind:"onyx.Toolbar", content:"iframe"},
			{kind:"Scroller", fit:true, components: [
				{kind:"Repeater", count:30, onSetupItem:"setupItem", ondragstart:"dragStart", ondrop:"drop", ondown:"eventInfo", onup:"eventInfo", components: [
					{style:"border-bottom: 1px solid gray; background:white; padding: 10px;", name:"label"}
				]}
			]},
			{kind:"onyx.Toolbar", components:[{kind:"onyx.Button", content:"Clear", ontap:"clearInfo"}]},
			{kind:"Scroller", style:"height:200px;", name:"info"}
		]}
	],
	rendered: function() {
		this.inherited(arguments);
		this.setupRPC();
		this.setupRemoteEvents();
	},
	setupItem: function(inSender, inEvent) {
		inEvent.item.$.label.setContent("RightItem" + inEvent.index);
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
	remoteUp: function() {
		enyo.gesture.downEvent = null;
		enyo.gesture.drag.dragEvent = null;
		this.appendInfo("remote up");
	},

	// ---- RPC functions -----
	setupRPC: function() {
		this.remote = window.parent;
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
