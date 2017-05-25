$(document).ready(function() {
  var map1;
  var map2;
  var actual_collection_id = "";
  var collections = {};
  var collection_counter = 0;
  var collections_markers_map1 = {};
  var collections_markers_map2 = {};
  var users_info = {};
  var actual_parking_i = 0;
  var parking_users = {};
  var users_counter = 0;
  var disable_elected = false;


  function show_map(id){
    // create a map in the "map" div, set the view to a given place and zoom
    map = L.map(id).setView([40.4169, -3.7034], 10);
    // add an OpenStreetMap tile layer
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
  }

  $("#getJSON").click(function(){
    $('#getJSON').remove();
    $('#data').show();
    $('#save_data').click(function(){
      console.log("click_save_data");
      save_data();
    })
    $('#load_data').click(function(){
      console.log("load_data");
      load_data();
    });
    $('#page-1').show();

    //mapa 1
    if (map1 == undefined){
      map1 = show_map('map-1');
    }

    $.getJSON("js/aparcamientos.json", function(data) {
      data = data['@graph'];
	    var list = '<ul>';
	    for (var i = 0; i < data.length; i++) {
        id = "parking1-"+i.toString();
        var name = data[i].title;
        if (data[i].organization['accesibility'] == 1){
          list += '<li id="'+ id +'" class="accessible">' + name + '</li>';
        } else {
          list += '<li id="'+ id +'">' + name + '</li>';
        }
        //inicializamos parking_users
        parking_users[i]=[];
	    }
	    list += '</ul>';
	    $('#parkings-1').html(list);

      //APARCAMIENTOS ACCESIBLES
      $("#disable-1").click(function(){
        if (disable_elected){
          disable_elected = false;
          $(".accessible_selected").each(function(){
            $(this).switchClass("accessible_selected", "accessible");
          })
        } else {
          disable_elected = true;
          $(".accessible").each(function(){
            $(this).switchClass("accessible", "accessible_selected");
          })

        }
      })

      create_listeners(data);

      //cambios de pestaña
      $("#tab-2").click(function(){
        //borramos marcadores de la coleccion en mapa1
        prev_name = $("#"+actual_collection_id).html();
        if (prev_name != ""){
          var prev_markers = collections_markers_map1[prev_name];
          delete_markers(prev_markers);
        }
        second_page(data);
      });

      $("#tab-3").click(function(){
        third_page();
      });

      $("#tab-1").click(function(){
        $('#page-1').show();
        $('#page-2').hide();
        $('#page-3').hide();
        $("#page-4").hide();

        //añadimos los marcadores de la coleccion
        if (actual_collection_id != ""){
          var collection_name = $("#"+actual_collection_id).html();
          show_collection_page1(data,collection_name);
          var markers = collections_markers_map1[collection_name];
          show_markers(markers,map1);
        } else {
          $("#info_collection-1").hide();
        }
      });
	  });
  });

  function delete_markers(markers){
    if (markers != undefined){
      for (var i=0; i< markers.length; i++){
        markers[i].remove();
      }
    }
  }

  function show_markers(markers,map){
    for (var i=0; i< markers.length; i++){
      markers[i].addTo(map);
      $(marker[i]).click(function(){
        show_parking_info(data,i);
      })
    }
  }

  function create_listeners(data){
	  for (var i = 0; i < data.length; i++) {
      id = "#parking1-"+i.toString();
      $(id).click(function(e){
        i = e.currentTarget.id.split("-")[1];
        show_parking_info(data,i);
        //creamos el marcador en el mapa
        create_marker(map1,data,i);
      });
    }
  }

  function show_collection_page1(data,name){
    $('#info_collection-1').show();
    $("#description_collection-1 > h4").html(name);
    $('#descr_droppable-1').html("");

    var parkings = collections[name];
    console.log(parkings);
    for(var i=0; i< parkings.length; i++){
      //cambiamos id para la pagina principal
      var parking = parkings[i].split('page-2')[0] + 'page-1' + parkings[i].split('page-2')[1].split("<i")[0] + "</li>";
      $('#descr_droppable-1').append(parking);
      parking_id = parking.split('"')[1];
      $("#"+parking_id).click(function(){
        i = $(this)[0].id.split("-")[3];
        show_parking_info(data,i);
      })
    }
  }

  function show_parking_info(data,i){
    var prev_parking_i = actual_parking_i;
    actual_parking_i = i;
    $('#info-1').show();
    $('#description-1').html("<h4>"+data[i].title+"</h4>");
    info = '<p>' + data[i].address['street-address'] + '</br> ';
    info += data[i].address['postal-code'] + ', ';
    info += data[i].address.locality + '</br>';
    info += 'Lat: ' + data[i].location.latitude + '</br>';
    info += 'Lng: ' + data[i].location.longitude + '</p>';
    info += '<p>' + data[i].organization['organization-desc'] + '</p>'
    $('#description-1').append(info);
    //añadimos fotos
    $("#photos-1").show();
    get_photos(data[i].location.latitude, data[i].location.longitude);
    load_parking_users(prev_parking_i);
  }

  function load_parking_users(prev_parking_i){
    if (prev_parking_i != actual_parking_i){
      if(parking_users[actual_parking_i].length>0){
        $("#droppable-users-3").html("");
        for (var i=0; i<parking_users[actual_parking_i].length; i++){
          var id = parking_users[actual_parking_i][i];
          var html = "<div class='user-box'>";
          html += "<p>"+users_info[id].name+"</p>";
          html += "<img src='"+users_info[id].image+"'></img>";
          html += "</div>";
          $("#droppable-users-3").append(html);
        }
      } else {
        $("#droppable-users-3").html("<span class='nota'>Arrastra hasta aquí los usuarios que desees añadir.</span>");
      }
    }
  }

  function create_marker(map,data,i){
    short_name = data[i].title.split(".")[1];
    marker = L.marker([data[i].location.latitude, data[i].location.longitude]);
    marker.addTo(map)
      .bindPopup(short_name)
      .openPopup();
    $(marker).click(function(){
      show_parking_info(data,i);
    })
    return marker;
  }

  function get_photos(lat,lng){
    src = "https:\/\/commons.wikimedia.org\/w\/api.php?format=json&action=query&generator=geosearch&ggsprimary=all&ggsnamespace=6&ggsradius=500&ggscoord="+lat+"|"+lng+"&ggslimit=10&prop=imageinfo&iilimit=1&iiprop=url&iiurlwidth=200&iiurlheight=200&callback=?";
    $.getJSON(src, function(data) {
      var i = 0;
      $.each(data.query.pages, function(key, value){
        //Add pics
        if (i<6){
          $("#img"+i.toString())[0].src = value.imageinfo[0].url;
          $("#selector-"+i.toString())[0].src = value.imageinfo[0].url;
          i++;
        }
      })

      //Show pics
      $("#switcher-1").show();

      $('#myCarousel-1').carousel({
          interval: 1500
      });

      //Handles the carousel thumbnails
      $('[id^=selector-]').click( function(){
        var i = this.id.substr(this.id.lastIndexOf("-") + 1);
        $(".active").removeClass('active');
        $("#img"+i.toString()).parent().addClass('active');
      });
	  });
  }

  function second_page(data){
    $('#page-1').hide();
    $('#page-2').show();
    $('#page-3').hide();
    $("#page-4").hide();


    //mapa 2
    if (map2 == undefined){
      map2 = show_map('map-2');
    }

    //listado de parkings DRAG
    $('#parkings-2').html($('#parkings-1').html());
    $('#parkings-2 > ul').children().each( function(i){
      $(this).attr('id','parking2-'+i.toString());
      $('#parking2-'+i.toString()).draggable({
        cancel: "a.ui-icon",
        rever: "invalid",
        containment: 'document',
        helper: "clone",
        cursor: "grabbing",
        appendTo: 'body',
        stack: "#descr_droppable-2"
      });
    });

    //DROP
    $('#descr_droppable-2').droppable({
      over: function(event, ui){
        $(this).addClass("ui-state-highlight");
      },
      drop: function(event, ui){
        $(this).removeClass("ui-state-highlight");
        name = $('#description-2 > .selected_collection > h4').html();
        if(name == ""){
          window.alert("Seleccione primero una colección.");
        } else {
          name = name.split("<i")[0];
          selected = ui.draggable.context.innerHTML;
          parking_i = ui.draggable.context.id.split("-")[1];
          col_i = actual_collection_id.split("-")[1];
          parking_id = "col-"+col_i.toString()+"-parking-"+parking_i.toString()+"-page-2";
          delete_id = parking_id + "-delete";
          selected = '<li id="'+parking_id+'">' +selected+ '<i id="'+delete_id+'" class="fa fa-times"></i></li>';
          if ($.inArray(selected, collections[name]) == -1){ //NO REPETIDO
            collections[name].push(selected);
            show_collection_page2(name);
            marker_1 = create_marker(map1,data,parking_i);
            collections_markers_map1[name].push(marker_1);
            marker_2 = create_marker(map2,data,parking_i);
            collections_markers_map2[name].push(marker_2);
          } else {
            window.alert("Este aparcamiento ya fue añadido a la colección.");
          }
        }
      },
    });

    //gestion de colecciones
    $('#crear-2').click(function(){
      new_collection = $('#nombre-2').val();
      if(new_collection != ''){
          if (new_collection in collections){
            window.alert("Nombre de colección repetido. Elija otro, por favor.");
          } else {
            collections[new_collection] = [];
            collections_markers_map2[new_collection] = [];
            collections_markers_map1[new_collection] = [];
            actual_collection_id = "collection2-"+collection_counter.toString();
            collection_counter++;
            $("#col-list-2").append('<li id="'+actual_collection_id+'">'+new_collection+'</li>');
            $('#'+actual_collection_id).click(function(e){
              $('#modify_collection').remove();

              actual_collection_id = $(this).context.id;
              prev_name = $("#description-2 > div > h4").html().split("<")[0];
              var prev_markers_1 = collections_markers_map1[prev_name];
              delete_markers(prev_markers_1);
              var prev_markers_2 = collections_markers_map2[prev_name];
              delete_markers(prev_markers_2);
              show_collection_page2($(this).html());
            })
          }
      }
    })

  }

  function show_collection_page2(name){
    icons = "<i id='edit_col' class='fa fa-pencil-square-o'</i><i id='delete_col' class='fa fa-trash'></i>";
    $("#description-2 > div > h4").html(name + icons);
    $('#descr_droppable-2').html("");
    var parkings = collections[name];
    for(var i=0; i< parkings.length; i++){
      $('#descr_droppable-2').append(parkings[i]);
      delete_id = parkings[i].split('id="')[2].split('"')[0];

      //borrar parking
      $('#'+delete_id).click(function(){
        parking_id = $(this)[0].id.split("-delete")[0];
        parking_to_delete = '<li id="'+parking_id+'">'+$("#"+parking_id).html()+'</li>';
        $("#"+parking_id).remove();
        var parking_position = $.inArray(parking_to_delete, collections[name]);
        //borrar de todas las variables
        collections[name].splice(parking_position,1);
        collections_markers_map2[name][parking_position].remove();
        collections_markers_map2[name].splice(parking_position,1);
        collections_markers_map1[name][parking_position].remove();
        collections_markers_map1[name].splice(parking_position,1);
      })
    }
    var markers2 = collections_markers_map2[name];
    show_markers(markers2,map2);

    //borrar coleccion
    $("#delete_col").click(function(e){
      delete_markers(markers2);
      $("#"+actual_collection_id).remove();
      $("#description_collection-1 > h4").html("");
      $("#description-2 > div > h4").html("");
      $('#descr_droppable-1').html("");
      $('#descr_droppable-2').html("");
      delete collections[name];
      delete collections_markers_map2[name];
      delete collections_markers_map1[name];
      actual_collection_id = "";
    })

    //modificar nombre de coleccion
    $("#edit_col").click(function(e){
      console.log("NOMBRE = " + name);
      console.log("actual: " + actual_collection_id);
      var form = '<div id="modify_collection">Nuevo nombre:';
      form += '<input id="cambiar-nombre-2" type="text" name="" value="">';
      form += '</input><input id="cambiar-2" type="submit" value="Cambiar"></input></div>';
      $('#description-2 > .selected_collection').append(form);
      $('#cambiar-2').click(function(){
        new_collection_name = $('#cambiar-nombre-2').val();
        if (new_collection_name in collections){
          window.alert("Ese nombre ya está en uso. Elija otro, por favor.");
        }else{
          $("#description_collection-1 > h4").html(new_collection_name);
          icons = "<i id='edit_col' class='fa fa-pencil-square-o'</i><i id='delete_col' class='fa fa-trash'></i>";
          $("#description-2 > div > h4").html(new_collection_name + icons);
          $("#"+actual_collection_id).html(new_collection_name);
          modify_key_names(name,new_collection_name);
        }
        $('#modify_collection').remove();
      })
    })
  }

  function modify_key_names(old_name,new_name){
    collections[new_name] = collections[old_name];
    delete collections[old_name];
    collections_markers_map1[new_name] = collections_markers_map1[old_name];
    delete collections_markers_map1[old_name];
    collections_markers_map2[new_name] = collections_markers_map2[old_name];
    delete collections_markers_map2[old_name];
  }

  function third_page(){
    $('#page-1').hide();
    $('#page-2').hide();
    $('#page-3').show();
    $("#page-4").hide();


    if ($("#description-1").html() == ""){
      $("#no-parking").show();
    } else {
      $("#no-parking").hide();
      $("#info-parking-3").show();
      $("#description-3").html($("#description-1").html());
      $("#myCarousel-3").html($("#myCarousel-1").html());
      $("#myCarousel-1  > .carousel-inner > .item > img").each(function(i){
        $(this)[0].id = "img3-"+i.toString();
      })
      $('#myCarousel-3').carousel({
          interval: 1500
      });
      $("#switcher-3  > .row > .hide-bullets > li > a").each(function(i){
        var img = $("#selector-"+i.toString())[0].parentNode.innerHTML;
        $(this).html(img);
      })
      //cambiamos id de las fotos en miniatura
      $("#switcher-3  > .row > .hide-bullets > li > a > img").each(function(i){
        $(this)[0].id = "selector3-"+i.toString();
      })
      $("#droppable-users-3").height($("#switcher-3").height()-160);
      
      //DROP
      $('#droppable-users-3').droppable({
        over: function(event, ui){
          $(this).addClass("ui-state-highlight");
        },
        drop: function(event, ui){
          $("#droppable-users-3 > span").remove();
          $(this).removeClass("ui-state-highlight");
          var div_id = ui.draggable.context.id;
          var i = div_id.split("-")[1];
          var user_id = Object.keys(users_info)[i];
          if ($.inArray(user_id,parking_users[actual_parking_i]) != -1){
            window.alert("Este usuario ya se encuentra añadido.");
          }else{
            parking_users[actual_parking_i].push(user_id);
            var trash_id = "trash-"+div_id+"-park-"+actual_parking_i;
            var trash = "<i id='"+trash_id+"' class='fa fa-trash'></i>";
            var html = "<div class='user-box'>";
            html += "<p>"+users_info[user_id].name+"</p>" + trash;
            html += "<img src='"+users_info[user_id].image+"'></img>";
            html += "</div>";

            $("#droppable-users-3").append(html);
            $("#"+trash_id).click(function(){
              var user_id = $(this).context.id.split("-")[2];;
              parking_users[actual_parking_i].splice(user_id,1);
              $("#" + $(this).context.id ).parent().remove();
            })
          }

        },
      });

      $("#start_websocket").click(function(){
        websocket();
      })
    }

  }


  //WEBSOCKET
  function websocket(){
		var output = document.getElementById("users-list-3");

		try {

			var host = "ws://localhost:12345/";
			console.log("Host:", host);
			var s = new WebSocket(host);

			s.onopen = function (e) {
				console.log("Socket opened.");
        $("#start_websocket").hide();
			};
			s.onclose = function (e) {
				console.log("Socket closed.");
			};

			s.onmessage = function (e) {
        if (e.data in users_info){
          console.log("repetido");
        }else{
          //console.log("Socket message:", e.data);
          users_info[e.data] = {};
          find_google_plus_user(e.data);
        }
			};

			s.onerror = function (e) {
				console.log("Socket error:", e);
			};

		} catch (ex) {
			console.log("Socket exception:", ex);
		}
  }


  function find_google_plus_user(id){
    var apiKey = 'AIzaSyCBlcH0VGi7NgVdPo3a1CHHPC5pTS3iP4g';
    // Use a button to handle authentication the first time.
    gapi.client.setApiKey(apiKey);
    makeApiCall(id);

  }

  // Load the API and make an API call.  Display the results on the screen.
  function makeApiCall(id) {
    gapi.client.load('plus', 'v1', function() {
      var request = gapi.client.plus.people.get({
        'userId': id
        // For instance:
        // 'userId': '+GregorioRobles'
      });
      request.execute(function(resp) {
        var i = Object.keys(users_info).length-1;
        users_info[id].name = resp.displayName;
        users_info[id].image = resp.image.url;

        add_available_user(id, i);
      });
    });
  }

  function add_available_user(id, i){
    var html = "<div class='user-box'>";
    html += "<p>"+users_info[id].name+"</p>";
    html += "<img src='"+users_info[id].image+"'></img>";
    html += "</div>";
    $("#user-" + i.toString()).html(html);
    $('#user-'+i.toString()).draggable({
      cancel: "a.ui-icon",
      rever: "invalid",
      containment: 'document',
      helper: "clone",
      cursor: "grabbing",
      appendTo: 'body',
      stack: "#droppable-users-3"
    });
  }

  function print_collection_in_list(i, name){
      id = "collection2-"+i.toString();
      $("#col-list-2").append('<li id="'+id+'">'+name+'</li>');
      $('#'+id).click(function(e){
        $('#modify_collection').remove();

        actual_collection_id = $(this).context.id;
        prev_name = $("#description-2 > div > h4").html().split("<")[0];
        show_collection_page2($(this).html());
      })
}


  function save_data(){
    $("#result-4").html("");
    $("#page-1").hide();
    $("#page-2").hide();
    $("#page-3").hide();
    $("#page-4").show();


    $("#guardar").click(function(){
      //GET TOKEN
      var git_token = $("#token-4").val();
      var github = new Github({
        token: git_token,
        auth: "oauth"
      });

      //GET REPO
      var git_user = $("#git-user-4").val();
      var git_repo = $("#repo-4").val();
      var save_repo = github.getRepo(git_user, git_repo);

      //WRITE FILE
      var git_file = $("#file-4").val() + ".json";
      var data = {
        "collections": collections,
         "users_info": users_info,
        "parking_users": parking_users
      }
      data = JSON.stringify(data);
      save_repo.write('master', git_file, //rama, nombre fichero
        data, //contenido del fichero en string!!
        "Datos Práctica final almacenados", function(err) { //mensaje del commit, funcion si hay error
          console.log (err);
        });
      $("#result-4").html("<h3>Datos almacenados</h3>");
    })
  }


  function load_data(){
    $("#result-4").html("");
    $("#page-1").hide();
    $("#page-2").hide();
    $("#page-3").hide();
    $("#page-4").show();


    $("#cargar").click(function(){

      //GET TOKEN
      var git_token = $("#token-4").val();
      var github = new Github({
        token: git_token,
        auth: "oauth"
      });

      //GET REPO
      var git_user = $("#git-user-4").val();
      var git_repo = $("#repo-4").val();
      var load_repo = github.getRepo(git_user, git_repo);

      //READ FILE
      git_file = $("#file-4").val() + ".json";

      load_repo.read('master', git_file, function(err, data) { //devuelve data.json

        data = JSON.parse(data);

        collections = data.collections;
        collection_counter = Object.keys(collections).length;
        users_info = data.users_info;
        parking_users = data.parking_users;

        var div_c = document.createElement("div");
        div_c.id = "collections-page-4";
        $("#result-4").append(div_c);
        $("#collections-page-4").html("<h3 class='title'>Colecciones</h3>");
        var j = 0;
        $.each(collections, function(key, value){
          print_collection_in_list(j, key)
          var html = "<p>" + key + ": <ul>";
          for (var i=0; i<value.length; i++){
            name = value[i].split(">")[1].split("<")[0];
            html += "<li>" + name + "</li>";
          }
          $("#collections-page-4").append( html + "</ul></p>");
          j++;
        })
        

        var div_u = document.createElement("div");
        div_u.id = "users-page-4";
        $("#result-4").append(div_u);
        $("#users-page-4").html("<h3 class='title'>Usuarios disponibles</h3>");
        var i = 0;
        $.each(users_info, function(key, value){
          $("#start_websocket").hide();
          add_available_user(key, i);
          $("#users-page-4").append("<p>" + key + ":  " + value.name + "<img src='" + value.image + "'></img></p>");
          i++;
        })


        var div_p = document.createElement("div");
        div_p.id = "parking-users-page-4";
        $("#result-4").append(div_p);
        $("#parking-users-page-4").html("<h3 class='title'>Usuarios de instalaciones:</h3>");
        $.each(parking_users, function(key, value){
          if (value.length > 0){
            var html = "<p>Parking_id = " + key + ": <ul>";
            for (var i=0; i<value.length; i++){
              html += "<li>" + value[i] + "</li>";
            }
            $("#parking-users-page-4").append(html + "</ul></p>");
          }
        })
        var i = -1;
        load_parking_users(i); //para que cargue sea cual sea el anterior.
      });
      
    });
  }
});



