# Table populator plugin #

Table populator is a intuitive and easier Jquery plugin to populate html 5 tables ajaxly.

[Live demo](https://jsfiddle.net/albertortizl/v7dgqyq2/)

## Basic Usage ##

Import plugin files in your page

```html
<script src="${path}/table-populator.js"></script>
<link type="text/css" rel="stylesheet" href="${path}/table-populator.css"/>

```

Add some table in your code

```html
<table id="my-table-id">
     <thead>
	     <tr>
	         <th data-sort-key="name" >Nombre</th>
	         <th >Descripción</th>
	     </tr>
     </thead>
</table>
```

The basic usage consist only to provide an URL to get the data, pagination triggers, and your mappings  

```javascript
 $('#my-table-id').tablePopulator({
            fetch_url: "${path}/my_elements.json",
            previous_button_selector: "#prev-button",
            next_button_selector: "#next-button",
            row_mapper:  function (json_element, row_element) {
                            row_element[0]=json_element.some_property
            }
        });
```

##### Sample #####

We have the previous table, and /my_elements.json response is like:

```json
[
	{ 
		"id":123,
		"name" : "john doe",
		"address":"Barcelona",
		"age": 33
	},
	{ 
		"id":124,
		"name" : "jane doe",
		"address":"Madrid",
		"age": 30
	}
]
```
We only have to add the correct mapper function on plugin

```javascript
 $('#my-table-id').tablePopulator({
            fetch_url: "${path}/my_elements.json",
            previous_button_selector: "#prev-button",
            next_button_selector: "#next-button",
            row_mapper:  function (json_element, row_element) {
                  row_element[0]=json_element.name;
                   row_element[1]=json_element.address;
                   row_element[2]=json_element.age;
                   row_element[3]='<a href="/edit_'+json_element.id+'.html"> Edit </a>';
            }
        });
```


### Http call ##


To get the data asynchronously this plugin makes a HTTP call:

**HTTP method**:  

 - GET

**Headers :** 

 - Accept: application/json, text/javascript


**Query params** 

 - skip : Integer
 - limit : Integer
 - order_by ( optional ) : String
 - sort ( optional ) : ASC | DESC
 - query ( optional ) : String


## Sorting fields##

If you want to sort fields ajaxly you only have to add a custom attribute in your desired table headers
```html
<th data-sort-key="name" >Nombre</th>
```
This plugin automatically add two params, *order_by* and *sort* to the ajax call


## plugin options ##


| Option        | Type           | Mandatory  | Default value       | Description     | 
| ------------- |:--------------:| ----------:| -------------------:|----------------:|
| fetch_url      			| String	| yes | 		| url to request your data
| previous_button_selector  | String		| yes | 		| valid jquery button selector to trigger the data
| next_button_selector 		| String    | yes | 		| valid jquery button selector to trigger the data
| row_mapper				| Function 	| yes | 		| function called when parsing the data received from server, It must make the making from a single json element to a array row
| search_field_selector		| String 	| no  | 		| valid jquery input selector to trigger the data if you want to search
| pagination_limit			| Integer 	| no  |20 		| pagination limit
| save_table_status			| Boolean 	| no  | false	| Set to true if you want to save status table in a browser database between pages
| save_table_status_store_key			| String 	| no  | 	| (When save_table_status is enabled) Key to store on browser repository
| save_table_session_expiration			| Boolean 	| no  | false	| (When save_table_status is enabled) Set to true if you want to save only in session scope
| beforeRender				| Function 	| no  | 		| Triggered before render the results obtained
| afterRender				| Function 	| no  | 		| Triggered after render the results obtained ( if you want to apply javascript plugins to decorate for example )


## plugin functions ##

### reload ###

If you want to reload manually table populator :
```javascript
<script>
    $(document).ready(function () {
        var populator = $('#test-table').tablePopulator({
            fetch_url: "http://some_json_url.json",
            previous_button_selector: "#prev",
            next_button_selector: "#next",
            pagination_limit: 5,
            search_field_selector: "#search-input",
            row_mapper: function (json_element, row_element) {
                row_element[0] = json_element.username
                row_element[1] = json_element.email
                row_element[2] = json_element.age
            }
        });
        $('#manual-reload').click(function () {
            populator.tablePopulator("reload");
        });
    });
```



</script>



## Global pagination status ##

This plugin doesn't contain information about how many elements are in total, in which number of page you are or the posibility of go to a some page.

This plugin only contains a ***previous button*** and a ***next button*** because it tryes to avoid complexity and overqueries on server like select counts.

In 99% of cases you doesn't need that kind of information, sorting and filtering is enough.

But, if you need to show that information this plugin provide a custom option to do that:

```javascript
 $('#my-table-id').tablePopulator({
           ...
            pagination_global_status: {
                enabled: true,
                print_selector: "#some-div-id",
                url_counter: "${path}/elements_counter.json",
                separator: "/",
                of_literal: "of"
            },
           ...
        });
``` 

This option will print in some div something like:

		20/40 of 3022 

This is ***offset/limit of total*** of elements

Populate plugin will make an http call with same params as fetch call.


| Option        | Type           | Mandatory  | Default value       | Description     | 
| ------------- |:--------------:| ----------:| -------------------:|----------------:|
| enabled      		| Boolean	| no  	| false		| enables this functionallity
| print_selector  	| String	| yes 	| 	| valid jquery element selector to print the data
| url_counter 		| String    | yes 	| 	| url to request your data, this must return a json response with single integer or string with a total of elements
| separator			| String 	| no 	| 	"/"	| symbol to separate
| of_literal		| String 	| no 	| 	"of"	| literal if you want to internationalize



## Advanced usage ##

```javascript
 $('#my-table-id').tablePopulator({
            save_table_status:true,
            save_table_session_expiration: true,
            save_table_status_store_key:"table-devices-groupingby-34",
            fetch_url: "${path}/config/gateway/devices/accepted.json",
            previous_button_selector: "#prev-button",
            next_button_selector: "#next-button",
            search_field_selector: null,
            pagination_limit: 20,
            pagination_global_status: {
                enabled: true,
                print_selector: "#global status span",
                url_counter: /count.json,
                separator: "/",
                of_literal: "of"
            },
            row_mapper: function (json_element, row_element) {
                alert("please implement row_mapper function to print results")
            },
            beforeRender: function (jsonData) {
            },
            afterRender: function (jsonData) {
            }
        });
``` 

## CSS customization ##

If you want to change loading image or sorting icons modify css provided with the plugin or override css in your page.

## Plugin dependencies ##

 JQuery >= 1.7
 Jquery UI >=1.8