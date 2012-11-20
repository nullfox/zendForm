/*
 *
 * jQuery Zend Form Plugin
 * Requires jQuery and jQuery Form Plugin
 * Ben Fox
 *
 */
(function($) {
    $.zendForm = {
        options: {
            clearForm: false,
            extraData: {},
            
            beforeSubmit: null,
            
            onSuccess: null,
            onError: null,
            
            iframe: false,
            
            defaultErrorSelector: null,
            errorSelectors: {}
        }
    };
    
    $.fn.zendForm = function(options) {
        return $(this).each(function() {
            var opts = $.extend({}, $.scForm.options, options);
            
            var el = $(this);
            
            var iframe = $(el).find('input[type="file"]').size() > 0 ? true : opts.iframe == true ? true : false;
            
            var beforeSubmit = function(arr, frm, o) {
                el.find('ul.errors').slideUp(function() {
                    $(this).remove();
                });
                
                if(typeof opts.beforeSubmit == 'function') {
                    opts.beforeSubmit(arr, frm, o);
                }
            };
            
            var onSuccess = function(response, status) {
                if(response.status == 1) {
                    if(opts.clearForm) { el.clearForm(); }
                    
                    if(typeof opts.onSuccess == 'function') {
                        opts.onSuccess(response, el);
                    }
                } else {
                    if(typeof opts.onError == 'function') {
                        
                        // Returning false here lets us cancel the rest of the process
                        if(opts.onError(response, el) === false) {
                            return;
                        }
                    }
                    
                    if(response.errors != null) {
                        var errors = response.errors;
                        var selector;
                        var messages;
                        
                        for(var name in errors) {
                            messages = [];
                            
                            for(var rule in errors[name]) {
                                messages.push(errors[name][rule]);
                            }
                            
                            // Get our selector based on options
                            if(opts.errorSelectors.hasOwnProperty(name)) {
                                if(typeof opts.errorSelectors[name] == 'function') {
                                    selector = opts.errorSelectors[name](messages, el);
                                    
                                    if(selector === false) { continue; }
                                } else {
                                    selector = el.find(opts.errorSelectors[name].replace('<name>', name));
                                }
                            } else {
                                if(opts.defaultErrorSelector != null) {
                                    if(typeof opts.defaultErrorSelector == 'function') {
                                        selector = opts.defaultErrorSelector(name, el);
                                        
                                        if(selector === false) { continue; }
                                    } else {
                                        selector = el.find(opts.defaultErrorSelector.replace('<name>', name));
                                    }
                                } else {
                                    selector = el.find(':input[name="' + name + '"]:last');

                                    if(selector.parent().find('.hint').size() > 0) {
                                        selector = selector.parent().find('.hint');
                                    }
                                }
                            }
                            
                            // Push the messages into a UL, in selector.after()
                            $(selector).after('<ul class="errors" style="display: none;"></ul>');
                            $.each(messages, function(idx, val) {
                                $(selector).parent().find('ul.errors').append('<li>' + val + '</li>');
                            });
                            $(selector).parent().find('ul.errors').slideDown();
                        }
                    }
                }
            };
            
            $(el).ajaxForm({
                dataType: 'json',
                clearForm: opts.clearForm,
                data: opts.extraData,
                iframe: iframe,
                beforeSubmit: function(f, j, o) {
                    beforeSubmit(f, j, o);
                },
                success: function(r, s) {
                    if(iframe == true) {
                        var clean = r.replace('<textarea>', '').replace('</textarea>', '');
                        
                        if(typeof(JSON) == 'object') {
                            r = JSON.parse(clean);
                        } else {
                            r = jQuery.parseJSON(clean);
                        }
                    }
                    
                    onSuccess(r, s);
                }
            });
        });
    }
})(jQuery);
