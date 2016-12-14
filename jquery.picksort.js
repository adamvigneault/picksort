/**
* picksort r1 // 2014.01.20 // jQuery 1.4.2+
* <http://www.adamvigneault.com>
* 
* @param     el
* @author    Adam Vigneault <adam@adamvigneault.com>
*/

(function($) {	
	var methods = {
		init   : function(params) {
			var $list    = $('.List', this), // The list container DIV
			    $baskets = $('.Baskets', this); // The baskets container DIV
			
			this.data(
				$.extend({
					"list"        : $list,
					"baskets"     : $baskets,
					"activeBasket": {}
				},
				$.fn.picksort.defaults,
				params)
			);
			
			// Load up user list and drop targets
			methods._loadList.apply(this);
			methods._setupTargets.apply(this);
			// Engage horizontal accordion on the baskets
			methods._setupBaskets.apply(this);
			
			return this;
		},
		addAll : function(ref) {
			var that        = this,
			    $basket     = $(ref),
			    basketIndex = $basket.data("selected");
			
			// Reset the list object and data object
			methods.remAll.apply(this, [ref]);
			$basket.data('selected',[]).empty();
			
			$users = $('ul:first-child li', this.data('list'));
			
			// Record IDs
			$users.each(function(i) {
				methods.addOne.apply(that, [$users[i], $basket]);
			});
			
			// Cancel HREF navigation
			return false
		},
		remAll : function(ref) {
			var that        = this,
			    $basket     = $(ref),
			    basketIndex = $basket.data('selected');
			
			for (i in basketIndex) {
				// Matches the event return schema of JqueryUI Autocomplete (e, ui)
				$basket.trigger("remOne", [{"item" : {"label" : null, "value" : basketIndex[i]}}]);
			}
			
			// Reset the list object and data object
			basketIndex.length = 0;
			$basket.empty();
			$basket.siblings('h3').children('.Counter').text("0");
			
			// Cancel HREF navigation
			return false;
		},
		addOne : function(el, basket) {
			var that        = this,
			    $el         = $(el),
			    $basket     = $(basket),
			    basketIndex = $basket.data('selected'),
			    editType    = $basket.data('edit'),
			    itemId      = Number($el.attr('id'));
			
			// add if the item is not in the basketIndex array
			if ($.inArray(itemId, basketIndex)==-1) {
				if (editType == "single") methods.remAll.apply(this,["#"+$basket.attr("id")]);
				
				basketIndex.push(itemId); // Record the item ID
				$basket.siblings('h3').children('.Counter').text(basketIndex.length); // Update the counter
				
				var $newItem = $el.clone();
				$newItem.append(
					$.fn.picksort.defaults.remLink
					.clone().click(function() {
						methods.remOne.apply(that,[this]); return false;
					})
				);
				
				// Matches the event return schema of JqueryUI Autocomplete (e, ui)
				$basket.trigger("addOne", [{"item" : {"label" : $el.html(), "value" : itemId}}]);
				
				$newItem.data("value", itemId);
				
				// Assemble
				$basket.append($newItem);
			}
		},
		remOne : function(el) {
			var that        = this,
			    $el         = $(el).parent(),
			    $basket     = $el.closest('ul'),
			    basketIndex = $basket.data('selected'),
			    value       = $el.data('value');
			    
			// Remove from the basket index
			basketIndex.splice($.inArray(value, basketIndex),1);

			$basket.siblings('h3').children('.Counter').text(basketIndex.length); // Reset counter
			// Matches the event return schema of JqueryUI Autocomplete (e, ui)
			$basket.trigger("remOne", [{"item" : {"label" : null, "value" : value}}]);
			
			$el.remove();
			
			return false;
		},
		_loadList : function() {
			var that         = this,
			    $listElement = $("ul:first-child", that.data('list')),
			    $listItems   = $('li', $listElement),
			    source       = this.data("source") || []; // Names array for autocomplete
			
			if (typeof source == "array")
			$listItems.each(function(key, value) {
				var $value = $(value);
				source.push({'label':$value.children(".Name").html(),'value':$value.attr('id')});
			});
			
			// Set up autocomplete on the search field
			var $searchField = this.find('input[data-action=searchIndex]');
			
			// Init autocomplete
			$searchField.autocomplete({
				'source'    : source,
				'minLength' : this.data('minLength'),
				'appendTo'  : this.data('list'),
				'search'    : function(e, ui) {
					$listElement.hide();
				},
				'select'    : function(e,ui) {
					return false;
				},
				'open'      : function(e,ui) {
					return false;
				},
				'close'     : function(e,ui) {
					return false;
				}});
			
			// Override selected methods as necessary
			$searchField.data("uiAutocomplete")._renderItem = function(ul, item) {
				// Modify the items that get rendered for drag/drop compatibility
				return $( "<li id=\""+item.value+"\"></li>" )
					//.data("item.autocomplete", item)
					.append(item.label)
					.draggable($.extend($.fn.picksort.defaults.dragConfig, {appendTo: that}))
					.dblclick(function(e) {
						methods.addOne.apply(that, [
						    e.target,
						    that.data('activeBasket').children('ul.Basket')]);
					})
					.appendTo( ul );
			};
			$searchField.data("uiAutocomplete").menu.options.selected = function(event, ui) {
				var $item = $(ui.item.data("item.autocomplete"));
				return false;
			};
			
			return this;
		},
		_setupTargets : function() {
			var that     = this,
			    $baskets = this.data('baskets'),
			    $listItems   = $("li", this.data('list'));
			    
			// Set draggable elements
			$listItems
				.draggable($.fn.picksort.defaults.dragConfig)
				.dblclick(function(e) {
					methods.addOne.apply(that, [
					    e.target,
					    that.data("activeBasket").children('ul.Basket')]);
			});
			
			// Configure baskets
			$baskets.find('ul.Basket').each(function(i, basket) {
				var $basket = $(basket),
				    $presort = $("li", $basket),
				    basketClass = $basket.attr('class').split(' ')[0];
				
				$basket.data('selected',[]);
				var basketIndex = $basket.data('selected');
				
				$presort.each(function(j, item) {
					var $item = $(item);
					
					basketIndex.push($item.data("value")); // record value
					
					$item.append($.fn.picksort.defaults.remLink
						.clone().click(function() {
							methods.remOne.apply(that,[this]); return false;
						})
					);
					
					$basket.siblings('h3').children('.Counter').text(basketIndex.length); // Update the counter
				});
				
				$basket.droppable({
					drop: function(e,ui) {
						methods.addOne.apply(that, [ui.draggable, this]);
					},
					hoverClass : "BasketHover"});
				// Prepopulate with selection values
				$listItems.each(function(j,e) {
					var $e = $(e);
					if ($e.find('table.'+basketClass+' .AFContentCell input').attr('checked') == 'checked') {
						methods.addOne.apply(that, [$e, $basket]);
					}
				});
			});
			
			// Setup Add and Remove All Buttons
			$('.AddAll').click(function() {methods.addAll.apply(that, [$(this).attr("href")]); return false;});
			$('.RemoveAll').click(function() {methods.remAll.apply(that, [$(this).attr("href")]); return false;});
			
			return this;
		},
		_setupBaskets : function() {
			var that       = this,
			    $baskets   = this.data("baskets"),
			    blockCount = $baskets.children('div').length,
			    minWidth   = 100,
			    maxWidth   = function() {
					return (that.width()-12) - ((blockCount-1)*minWidth);
				};
			
			// Reset active basket
			this.data("activeBasket", $baskets.children('div').first());
			
			// Setup click event on basket label
			$baskets.find("h3 a").click(function(){
				that.data("activeBasket")
					.animate({width: minWidth+"px"}, {queue:false, duration:200})
				    .removeClass("Active");
				// Reset active basket
				that.data("activeBasket", $($(this).attr('href')).parent());
				that.data("activeBasket")
					.animate({width: maxWidth()+"px"}, {queue:false, duration:200})
				    .addClass("Active");
				return false;
			});
			
			// Reset basket state
			$baskets.children("div")
				.css("width", minWidth+"px")
				.removeClass("Active");
			
			that.data("activeBasket")
				.css("width", maxWidth()+"px")
			    .addClass("Active");
			
			return this;
		}
	}
	
	$.fn.picksort = function(arg) {
		if (this.length<=0) return;
		
		if (methods[arg]) {
			return methods[arg].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof arg === 'object' || ! arg) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " + arg + " does not exist on jQuery.picksort");
		}
	}
	
	$.fn.picksort.defaults = {
		remLink : $('<a href="#" class="Inline Remove" title="Remove"><span>Remove</span></a>'),
		dragConfig : {
			delay: 100,
			opacity: 0.5,
			helper: "clone",
			cursor: "move",
			scroll: false
		},
		minLength : 1
	};
})(jQuery);