/*!
 * jQuery UI Widget-factory Wrap for plugin
 * Author: albert Ortiz Llousas
 * Dependencies: JQuery >= 1.7
 */

/*****************************************/
/*          JQUERY WRAP                  */
/*****************************************/

;
(function ($, undefined) {

    // define your widget under a namespace of your choice
    //  with additional parameters e.g.
    // $.widget( "namespace.widgetname", (optional) - an
    // existing widget prototype to inherit from, an object
    // literal to become the widget's prototype );

    $.widget("dexma.tablePopulator", {
        _realPlugin: null,

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            // _create will automatically run the first time this widget is called.
            _realPlugin = tablePopulator(this.element, this.options);
        },
        _init: function () {
        },

        // Destroy an instantiated plugin and clean up
        destroy: function () {

            // this.element.removeStuff();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },
        search: function (query) {
            _realPlugin.search(query);
        },
        reload: function (query) {
            _realPlugin.reload();
        }

    });

})(jQuery);


/*****************************************/
/*           Real plugin                 */
/*****************************************/

/**
 * Function that creates plugin instance (object literal) emulating OO features using closures
 *
 * @param $element
 * @param options
 * @returns {{hi: Function}}
 */
function tablePopulator($element, options) {

    // plugin defaults
    var _defaults = {
        save_table_status: false,
        save_table_status_store_key: null,
        save_table_session_expiration: false,
        fetch_url: null,
        previous_button_selector: null,
        default_order_field: null,
        default_sort: "DESC",
        next_button_selector: null,
        search_field_selector: null,
        pagination_limit: 20,
        pagination_global_status: {
            enabled: false,
            print_selector: null,
            url_counter: null,
            separator: "/",
            of_literal: "of"
        },
        row_mapper: function (json_element, row_element) {
            alert("please implement row_mapper function to print results")
        },
        mapResultOnReceive: function (jsonData) {
            return jsonData;
        },
        beforeRender: function (jsonData) {
        },
        afterRender: function (jsonData) {
        }

    };
    var _storage;

    var _options = $.extend(true, {}, _defaults, options);
    var _limit = _options.pagination_limit;
    var _$table = $element;
    var _$nextButton = $(_options.next_button_selector);
    var _$previousButton = $(_options.previous_button_selector);
    var _$loadingElement;
    var _$tbody;
    var _globalStatus = {
        $from: null,
        $to: null,
        $total: null,
        $globalStatusContainer: null,

    };

    var _status = {
        order_field: _options.default_order_field,
        sort: _options.default_sort,
        query: "",
        offset: 0
    };

    // call init method
    _init();

    // private methods


    /**
     * Function called on plugin initialization
     * @private
     */
    function _init() {
        _validatePluginDefaults();
        _setupStorage();
        _activatePaginationTriggers();
        _activateSortingTriggersInTableHeaders();
        _activateSearchTriggers();
        _setUpGlobalStatus();
        _enableNextButton(false);
        _enablePreviousButton(false);
        _wrapTable();
        _cleanUpTableBody();
        _setInitialUI();
        _fetchData();
    }

    function _reload() {
        _fetchData();
    }

    function _setupStorage() {
        if (_options.save_table_status) {
            if (typeof localStorage !== 'undefined') {
                if (_options.save_table_session_expiration) {
                    console.log("local storage time to live => always");
                    _storage = sessionStorage;
                } else {
                    console.log("local storage time to live => session");
                    _storage = localStorage;
                }


                if (_storage.getItem(_key('status')) != null) {
                    _status = JSON.parse(_storage.getItem(_key('status')));
                    if (_options.search_field_selector != null) {
                        $(_options.search_field_selector).val(_status.query);
                    }
                    console.log("read status from storage =>" + JSON.stringify(_status));
                }
            }

        } else {
            console.log("local storage is not available in this browser")
        }
    }

    function _setUpGlobalStatus() {
        if (_options.pagination_global_status.enabled) {
            if ($(_options.pagination_global_status.print_selector).length == 0) {
                throw "Error : invalid pagination_global_status.print_selector selector";
            }
            _globalStatus.$globalStatusContainer = $(_options.pagination_global_status.print_selector);

            var $from = $('<span class ="global_status_from"/>').html(" ... ");
            var $separator = $('<span class ="global_status_separator"/>').html(_options.pagination_global_status.separator);
            var $to = $('<span class ="global_status_to"/>').html(" ... ");
            var $of = $('<span class ="global_status_of"/>').html(_options.pagination_global_status.of_literal);
            ;
            var $total = $('<span class ="global_status_total"/>').html(" ... ");

            var $div = $('<div class ="global_status_container"/>')
                .append($from).append($separator).append($to).append($of).append($total);

            _globalStatus.$total = $total;
            _globalStatus.$globalStatusContainer.append($div);
            _globalStatus.$from = $from;
            _globalStatus.$to = $to;
        }
    }

    function _refreshStorage() {
        if (_options.save_table_status) {
            if (typeof localStorage !== 'undefined') {
                _storage.setItem(_key('status'), JSON.stringify(_status));
                console.log("saving status to local storage => " + JSON.stringify(_status));
            } else {
                console.log("ERROR: local storage is not available in this browser")
            }
        }
    }

    function _key(obj) {
        // TODO : create a hash of that
        if (_options.save_table_status_store_key == null) {
            console.log("ERROR: Impossible to access to local storage, you have to provide a save_table_status_store_key on a plugin" +
                " constructor")
        } else {
            return _options.save_table_status_store_key + '###' + obj;
        }

    }

    function _setInitialUI() {
        _$table.css({'min-height': '100px'});
    }

    /**
     * validate plugin mandatory properties and css selectors
     * @private
     */
    function _validatePluginDefaults() {
        if (_$table.get(0).tagName != 'TABLE') {
            throw "Plugin must be initialized in a table element";
        } else if (_options.fetch_url == null) {
            throw "Error : fetch_url option was not provided";
        } else if (_options.previous_button_selector == null) {
            throw "Error : previous_button_selector option was not provided";
        } else if (_options.next_button_selector == null) {
            throw "Error : next_button_selector option was not provided";
        } else if (_$nextButton.length == 0) {
            throw "Error : invalid next_button_selector ";
        } else if (_$previousButton.length == 0) {
            throw "Error : invalid previous_button_selector";
        } else if (_$nextButton.get(0).tagName != 'BUTTON') {
            throw "Error : next_button_selector must be a html button ";
        } else if (_$previousButton.get(0).tagName != 'BUTTON') {
            throw "Error : previous_button_selector must be a html button";
        }
    }

    /**
     * Wrap table html element in one div, it is necessary to show and hide loading icon
     *
     * @private
     */
    function _wrapTable() {
        var $wrapper = $('<div class="table_populator_wrapper"/>');
        _$loadingElement = $('<div class="table_populator_loading_wrapper" ><div class="table_populator_loading"></div></div>');
        $wrapper.insertAfter(_$table);
        _$loadingElement.appendTo($wrapper);
        var $div = $('<div/>').css({'min-height': '150px', 'clear': 'both'});
        _$table.appendTo($div);
        $div.appendTo($wrapper);

    }

    /**
     * Function to refresh data table
     *
     * @private
     */
    function _fetchData() {
        //_cleanUpTableBody();
        _showLoading();
        _enableNextButton(false);
        _enablePreviousButton(false);

        $.ajax({
            url: _options.fetch_url,
            cache: false,
            type: "GET",
            data: {skip: _status.offset, limit: (_limit + 1), order_by: _status.order_field, sort: _status.sort, query: _status.query},
            dataType: "json",
            success: function (data) {
                _hideLoading();
                var data = _options.mapResultOnReceive(data);
                var finalData = _handlePagination(data);
                var rows = _parseResponse(finalData);
                _options.beforeRender(finalData);
                _render(rows);
                _refreshGlobalStatusPagination();
                _options.afterRender(finalData);
            },
            error: function (error) {
                _cleanUpTableBody();
                alert(JSON.stringify(error));
            }
        });
        _fetchTotal();
    }


    //function _fillUpWithEmptyRows() {
    //    for(i=_$tbody.find('tr').length;i<_limit;i++) {
    //        _$tbody.append('<tr/>')
    //    }
    //}

    function _fetchTotal() {
        if (_options.pagination_global_status.enabled) {

            $.ajax({
                url: _options.pagination_global_status.url_counter,
                type: "GET",
                cache: false,
                data: {query: _status.query},
                dataType: "json",
                success: function (total) {
                    _globalStatus.$total.html(total);
                },
                error: function (error) {
                    alert(JSON.stringify(error));
                }
            });
        }
    }


    /**
     * Binding click events on next & previous buttons
     *
     * @private
     */
    function _activatePaginationTriggers() {
        _$nextButton.click(function () {
            _status.offset = _status.offset + _limit;
            _refreshGlobalStatusPagination();
            _refreshStorage()
            _fetchData();
        });
        _$previousButton.click(function () {
            _status.offset = _status.offset - _limit;
            _refreshGlobalStatusPagination();
            _refreshStorage()
            _fetchData();
        });
    }

    function _refreshGlobalStatusPagination() {
        if (_options.pagination_global_status.enabled) {
            if (_status.offset + _$tbody.find('tr').length > 0) {
                _globalStatus.$from.html(_status.offset + 1);
            } else {
                _globalStatus.$from.html(0);
            }
            _globalStatus.$to.html(_status.offset + _$tbody.find('tr').length);
        }
    }

    function _activateSearchTriggers() {
        if (_options.search_field_selector != null) {

            var typewatch = (function () {
                var timer = 0;
                return function (callback, ms) {
                    clearTimeout(timer);
                    timer = setTimeout(callback, ms);
                };
            })();

            $(_options.search_field_selector).each(function () {
                //$(this).on('blur', function () {
                $(this).keyup(function () {
                    var $field = $(this);
                    typewatch(function () {
                        _status.query = $field.val();
                        _status.offset = 0;
                        _refreshStorage()
                        _fetchData();
                    }, 500);
                });
                //});
            });
        }
    }

    /**
     * Destroy and create new tbody html element inside our table
     *
     * @private
     */
    function _cleanUpTableBody() {

        var $tbody = _$table.find('tbody');
        if ($tbody.length > 0) {
            $tbody.html();
            $tbody.remove();
        }
        _$tbody = $('<tbody/>');
        _$table.append(_$tbody);

    }

    /**
     * Hide loading div
     * @private
     */
    function _hideLoading() {
        _$loadingElement.hide();
        //_$tbody.css({'pointer-events': 'all', 'opacity': '1'});
    }

    /**
     * Show loading div and disable current tbody events
     * @private
     */
    function _showLoading() {
        _$loadingElement.css({'width': _$table.width()});
        _$loadingElement.show();
        _$tbody.css({'pointer-events': 'none', 'opacity': '0.3'});
    }

    function _enableNextButton(enable) {
        if (!enable) {
            _$nextButton.attr('disabled', 'disabled');
        } else {
            _$nextButton.removeAttr('disabled');
        }
    }

    function _enablePreviousButton(enable) {
        if (!enable) {
            _$previousButton.attr('disabled', 'disabled');
        } else {
            _$previousButton.removeAttr('disabled');
        }
    }


    function _initSortingDefaults() {
        // if there is some defaults set
        if (_status.order_field != null) {
            _assignSort(_status.order_field, _status.sort);
        }
        // else get the first header sortable and make it the selected one
        else {
            var thList = _$table.find('thead tr th[data-sort-key]');
            if (thList.length > 0) {
                var orderField = $(thList[0]).data('sort-key');
                _status.order_field = orderField;
                _assignSort(orderField, _status.sort);
            }
        }
    }

    function _activateSortingTriggersInTableHeaders() {

        // foreach header with custom data  'sort-key', that means header sorteable
        _$table.find('thead tr th[data-sort-key]').each(function () {
            // add cursor
            $(this).css({'cursor': 'pointer'});
            // add generic css class for UI arrows
            $(this).addClass('table_populator_sortable');
            // add trigger when click
            $(this).click(function () {
                _status.order_field = $(this).data('sort-key');
                _assignSort(_status.order_field, null);
                _refreshStorage();
                _fetchData();
            })
        });
        _initSortingDefaults();

    }

    function _assignSort(orderField, sortDirection) {

        _$table.find('thead tr th[data-sort-key]').each(function () {
            if ($(this).data('sort-key') != orderField) {
                $(this).removeClass('sort_down sort_up');
            }
        });

        var $th = _$table.find("thead tr th[data-sort-key='" + orderField + "']");
        if ($th) {
            var desc;
            if (sortDirection != null) {
                desc = sortDirection == "DESC";
            } else {
                desc = $th.hasClass('sort_up') || (!$th.hasClass('sort_down') && _status.sort == "DESC");
            }

            if (desc) {
                $th.removeClass('sort_up');
                $th.addClass('sort_down');
                _status.sort = "DESC";
            } else {
                $th.removeClass('sort_down');
                $th.addClass('sort_up');
                _status.sort = "ASC";
            }

        }
    }


    function _handlePagination(jsonArray) {
        if (jsonArray.length > _limit) {
            _enableNextButton(true);
        }
        while (jsonArray.length > _limit) {
            jsonArray.pop();
        }
        if (_status.offset > 0) {
            _enablePreviousButton(true);
        }
        return jsonArray;
    }

    /**
     * Transform json array of elements to a matrix of rows and row values calling to mapping function on each json element
     *
     * @param jsonArray
     * @returns {Array}
     * @private
     */
    function _parseResponse(jsonArray) {
        var rows = [];
        for (var i in jsonArray) {
            var rowValues = [];
            _options.row_mapper(jsonArray[i], rowValues);
            rows.push(rowValues);
        }
        return rows;
    }

    /**
     * Transform matrix of rows and row values to <tr> and <td>'s
     *
     * @param rows
     * @private
     */
    function _render(rows) {
        _cleanUpTableBody();
        for (var i in rows) {
            var $tr = $('<tr/>');
            _$tbody.append($tr)
            for (var j in rows[i]) {
                $tr.append($('<td/>').html(rows[i][j]));
            }
        }
        _$table.css({'min-height': ''});

    }

    // define object literal
    return {
        // public methods
        search: function (query) {
            _status.query = query;
            _fetchData();
        },
        reload: function () {
            _reload();
        }
    }
}


// TODO : add local storage as repository
function status(_prefix) {

    return {}
}