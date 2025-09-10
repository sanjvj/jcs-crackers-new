var getDataFromSheetsApi = null;
var appendDataToSheetsApi = null;
var addDataToSheetsApi = null;
const SHEET_ID = '1f_Jd_xTxHEQEMuV8uNdQOEZsXKZdHnApIJOgr7XspKg'

const CRACKERS_RANGE = 'Cracker List!A2:H'
const CATEGORIES_RANGE = 'Categories!A2:A'
const COUPONS_RANGE = 'Coupons!A2:B'
const DEFAULT_DISCOUNT_RANGE = 'Coupons!D2'
const LAST_BILL_NUMBER_RANGE = 'WebsiteData!A2'
const CONTEST_BILLS_RANGE = 'Contest!A2:A'
const ORDERS_RANGE = 'Orders!A2:R'
const ORDER_ROW_NUMBER_FOUND_RANGE = 'WebsiteData!C2'
const CONTEST_BILLS_ROW_NUMBER_FOUND_RANGE = 'WebsiteData!E2'
const VENDOR_EMAIL_RANGE = 'WebsiteData!K2'
const SHOP_OPEN_RANGE = 'ShopOpen!A2'
const SPINWHEEL_CONTEST = 'Contest!B2'
const SPIN_SEGMENTS = 'Contest!C2:C11'
const CURRENT_SEGMENTS_PERCENTAGE = 'Contest!E2:E11'
const CURRENT_SEGMENTS_NAME = 'Contest!C2:C11'

var VENDOR_EMAIL = `srisanjeevagencies@gmail.com`
var gotVendorEmail = false
const MINIMUM_ORDER_AMOUNT = 2000

var SHOP_OPEN = true
var fbInitialized = false

function reInitWebflow() {
    //RE-INIT WF as Vue.js init breaks WF interactions


    window.Webflow && window.Webflow.destroy();
    window.Webflow && window.Webflow.ready();
    window.Webflow && window.Webflow.require('ix2').init();

    document.dispatchEvent(new Event('readystatechange'));

    // IX 2 Fix for if you have different interactions at different breakpoints
    var resizeTimer;
    $(window).on('resize', function (e) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            //When the page is resized re-start animations
            document.dispatchEvent(new Event('readystatechange'));
        }, 500);
    });
}


function initFirebase() {


    var firebaseConfig = {
        /* cSpell:disable */

        apiKey: "AIzaSyBCBeZbbVGjVGkFQt18axwebw35NrD9u6c",
        authDomain: "jcs-crackers.firebaseapp.com",
        projectId: "jcs-crackers",
        storageBucket: "jcs-crackers.appspot.com",
        messagingSenderId: "200991228355",
        appId: "1:200991228355:web:14f1428b99f177ca67fd76",
        measurementId: "G-C723XRGRD0"
    };
    firebase.initializeApp(firebaseConfig);
    getDataFromSheetsApi = firebase.app().functions('us-central1').httpsCallable('getDataFromSheetsApi')
    addDataToSheetsApi = firebase.app().functions('us-central1').httpsCallable('addDataToSheetsApi')
    appendDataToSheetsApi = firebase.app().functions('us-central1').httpsCallable('appendDataToSheetsApi')

    /* cSpell:enable */

}

function validateEmail(email) {


    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


    return re.test(String(email).toLowerCase());
}

async function updateShopOpen() {
    return new Promise(async (resolve, reject) => {
        try {
            // if (!firebase)
            // initFirebase()
            if (!fbInitialized) {
                initFirebase()
                fbInitialized = true
            }

            let response = await getDataFromSheetsApi({
                sheetId: SHEET_ID,
                range: SHOP_OPEN_RANGE,
            });

            let range = response.data

            if (range.values.length > 0) {
                let shopOpen = range.values[0][0]

                if (shopOpen.toLowerCase() == 'yes') {
                    SHOP_OPEN = true
                } else {
                    SHOP_OPEN = false
                }
            }
            resolve()
        } catch (error) {
            console.log("Error getting shop open:", error);
            reject(error)
        }

    });
}

