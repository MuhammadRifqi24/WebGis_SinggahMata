document.addEventListener("DOMContentLoaded", function () {

    // Delay for 3 seconds (adjust as needed)
    setTimeout(function () {
        // Hide the splash screen
        var splashScreen = document.getElementById("splash-screen");
        splashScreen.style.display = "none";

        // Show the content div
        var contentDiv = document.getElementById("content");
        contentDiv.style.display = "block";

        initMap();
    }, 3000); // 3000 milliseconds = 3 seconds

    function initMap() {
        // include openlayer
        var mapView = new ol.View({
            center: ol.proj.fromLonLat([97.3520757, 5.1091684]),
            zoom: 15,
        });

        var map = new ol.Map({
            target: 'map',
            view: mapView,
        });

        var nonTile = new ol.layer.Tile({
            title: "None",
            type: "base",
            visible: false,
        });

        var osmFile = new ol.layer.Tile({
            title: "Open Street Map",
            visible: false,
            source: new ol.source.OSM(),
        });

        var googleSatLayer = new ol.layer.Tile({
            title: "Google Satelite",
            visible: true,
            source: new ol.source.XYZ({
                url: "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
                maxZoom: 20,
                tilePixelRatio: 1,
                tileSize: 256,
                projection: "EPSG:3857",
            }),
        });

        var baseGroup = new ol.layer.Group({
            title: "Base Maps",
            layers: [nonTile, osmFile, googleSatLayer],
        });

        map.addLayer(baseGroup);
        // include openlayer

        // Call API Polygon to Web
        var createLayer = function (title, layerName) {
            return new ol.layer.Tile({
                title: title,
                source: new ol.source.TileWMS({
                    url: 'http://localhost:8080/geoserver/gisSinggahMata/wms',
                    params: { 'LAYERS': 'gisSinggahMata:' + layerName, 'TILED': true },
                    serverType: 'geoserver',
                    visible: true
                })
            });
        };

        var polylineGroup = new ol.layer.Group({
            title: "Polyline",
            layers: [
                createLayer('Jalan Provinsi', 'jalan_provins'),
                createLayer('Jalan', 'jalan'),
                createLayer('Got', 'got'),
                createLayer('Jurong', 'juroeng'),
                createLayer('Lueng', 'lueng'),
                createLayer('Alue', 'alue'),
                createLayer('Sungai', 'krueng'),
            ],
        });

        map.addLayer(polylineGroup);

        var polygonGroup = new ol.layer.Group({
            title: "Polygon",
            layers: [
                createLayer('Batas Gampong Singgah Mata', 'batas_gampong'),
                createLayer('Rumah','rumah'),
                createLayer('Sawah','sawah'),
                createLayer('TK Pembina Baktiya Barat','tk_pembina'),

            ],
        });

        map.addLayer(polygonGroup);

        var pointGroup = new ol.layer.Group({
            title: "Point",
            layers: [
                createLayer('Point Rumah','point_rumah'),
                createLayer('Point Sawah','point_sawah'),
                createLayer('Point TK Pembina Baktiya Barat','point_tkpembina'),
                createLayer('Point SPBU Baktiya ','point_tkpembina'),

            ],
        });

        map.addLayer(pointGroup);

        // Create popup to switch layer
        var layerSwitcher = new ol.control.LayerSwitcher({
            activationMode: 'click',
            startActive: false,
            groupSelectStyle: 'children'
        });

        map.addControl(layerSwitcher);
        // Create popup to switch layer

        // Create popup Info layer
        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');
        var closer = document.getElementById('popup-closer');

        var popup = new ol.Overlay({
            element: container,
            autoPan: true,
            autoAnimation: {
                duration: 250
            }
        });

        map.addOverlay(popup);

        closer.onclick = function () {
            popup.setPosition(undefined);
            closer.blur();
            return false;
        };
        
        // Create popup Info layer
        function handlePopupLayer(
            layerName,
            featureInfoProperties,
            extraProperties = {}
        ) {
            map.on("singleclick", function (evt) {
                content.innerHTML = "";
                var resolution = mapView.getResolution();
                var url = createLayer(layerName, layerName.toLowerCase())
                    .getSource()
                    .getFeatureInfoUrl(evt.coordinate, resolution, "EPSG:3857", {
                        INFO_FORMAT: "application/json",
                        propertyName: featureInfoProperties,
                    });

                if (url) {
                    $.getJSON(url, function (data) {
                        var feature = data.features[0];
                        var props = feature.properties;
                        var popupContent = Object.entries(extraProperties)
                            .map(
                                ([key, label]) =>
                                    `<h6> ${label} : </h6> <p>${props[key]}</p> `
                            )
                            .join(" ");
                        content.innerHTML = popupContent;
                        popup.setPosition(evt.coordinate);
                    });
                } else {
                    popup.setPosition(undefined);
                }
            });
        }

        handlePopupLayer(
            "jalan",
            "Nama_Jalan, Panjang, Lebar, Jenis",
            {
                Nama_Jalan: "Nama Jalan",
                Panjang: "Panjang (m)",
                Lebar: "Lebar (m)",
                Jenis: "Jenis",
            }
        );

        handlePopupLayer(
            "jurong",
            "nama,panjang,lebar,jenis,status",
            {
                nama: "Nama Jurong",
                panjang: "Panjang (m)",
                lebar: "Lebar (m)",
                jenis: "Jenis",
                status: "Status",
            }
        );

        handlePopupLayer("got", "nama,panjang,lebar,jenis", {
            nama: "Nama Got",
            panjang: "Panjang (m)",
            lebar: "Lebar (m)",
            jenis: "Jenis",
        });

        handlePopupLayer("alue", "panjang", {
            panjang: "Panjang (m)",
        });

        handlePopupLayer("lueng", "nama,panjang,lebar", {
            nama: "Nama Lueng",
            panjang: "Panjang (m)",
            lebar: "Lebar (m)",
        });

        // End Call action popup layer Polyline

        // Call action popup layer Polygon
        handlePopupLayer(
            "rumah_poligon",
            "pemilik,telp,nik,jumlah_lk,jumlah_pr,jumlahhuni",
            {
                pemilik: "Pemilik Rumah",
                telp: "No. Telepon",
                nik: "NIK Pemilik",
                jumlah_lk: "Jumlah Pria",
                jumlah_pr: "Jumlah Wanita",
                jumlahhuni: "Total Penghuni",
            }
        );

        handlePopupLayer(
            "rumah_saya_poligon",
            "pemilik,jumlahlk,jumlahpr",
            {
                pemilik: "Pemilik Rumah",
                jumlahlk: "Jumlah Pria",
                jumlahpr: "Jumlah Wanita",
            }
        );

        handlePopupLayer(
            "bank_poligon",
            "nama",
            {
                nama: "Nama Bank",
            }
        );

        handlePopupLayer(
            "bapas_poligon",
            "nama",
            {
                nama: "Nama Bapas",
            }
        );

        handlePopupLayer(
            "bengkel_poligon",
            "nama",
            {
                nama: "Nama Bengkel",
            }
        );

        handlePopupLayer(
            "bulog_poligon",
            "name",
            {
                name: "Nama Bulog",
            }
        );

        handlePopupLayer(
            "kebun_poligon",
            "nama",
            {
                nama: "Nama Kebun",
            }
        );

        handlePopupLayer(
            "kesehatan_poligon",
            "nama",
            {
                nama: "Nama Lembaga Kesehatan",
            }
        );

        handlePopupLayer(
            "kios_poligon",
            "nama",
            {
                nama: "Nama Kios",
            }
        );

        handlePopupLayer(
            "kuburan_poligon",
            "nama",
            {
                nama: "Nama Kuburan",
            }
        );

        handlePopupLayer(
            "lapangan_poligon",
            "nama",
            {
                nama: "Nama Lapangan",
            }
        );

        handlePopupLayer(
            "meunasah_poligon",
            "nama",
            {
                nama: "Nama Meunasah",
            }
        );

        handlePopupLayer(
            "pabrik_padi_poligon",
            "nama",
            {
                nama: "Nama Pabrik Padi",
            }
        );

        handlePopupLayer(
            "panglong_poligon",
            "nama",
            {
                nama: "Nama Panglong",
            }
        );

        handlePopupLayer(
            "paya_rabo_poligon",
            "panjang,lebar",
            {
                panjang: "Panjang (m)",
                lebar: "Lebar (m)",
            }
        );

        handlePopupLayer(
            "pemerintahan_poligon",
            "nama",
            {
                nama: "Nama Lembaga Pemerintahan",
            }
        );

        handlePopupLayer(
            "pendidikan_poligon",
            "nama",
            {
                nama: "Nama Lembaga Pendidikan",
            }
        );

        handlePopupLayer(
            "rangkang_poligon",
            "pemilik",
            {
                pemilik: "Nama Pemilik",
            }
        );

        handlePopupLayer(
            "sawah_poligon",
            "pemilik",
            {
                pemilik: "Nama Pemilik",
            }
        );

        handlePopupLayer(
            "sehat_futsal_poligon",
            "nama",
            {
                nama: "Nama Futsal",
            }
        );

        handlePopupLayer(
            "tambak_ikan_poligon", "nama",
            {
                nama: "Nama Tambak",
            }
        );

        handlePopupLayer(
            "toko_poligon", "nama", {
            nama: "Nama Toko",
        });

        // You might need to trigger a resize event to ensure the map renders correctly
        setTimeout(function () {
            map.updateSize();
        }, 100);
    }


});