// Upload image in google drive and paste image id in the format:
// https://drive.google.com/uc?export=view&id=file's ID


// import productCategory from '../components/ProductCategory.vue'


new Vue({
    el: '#q-quick-purchase',
    components: {
        ProductCategory: () => import('../components/ProductCategory.vue'),
    },
    data: function () {
        return {
            showImageDialog: false,
            displayImageUrl: null,
            isItemsLoaded: false,
            isTermsAccepted: false,
            defaultDiscount: "50",
            items: [],
            categories: [],
            coupons: [],
            isCouponApplied: false,
            isCouponInvalid: false,
            lastBillNumber: "",
            mobileNumberError: '',
            pincodeError: '',
            orderDetails: {
                id: null,
                fullName: '',
                address: '',
                pincode: '',
                mobileNumber: '',
                email: '',
                defaultDiscount: '',
                coupon: '',
                couponApplied: null,
                billNumber: null,
                giftClaimed: false,
                items: [],
                subTotalA: null,
                discountAmount: null,
                subTotalB: null,
                nonDiscountTotal: null,
                grandTotal: null,
            }
        }
    },
    computed: {
        selectedItems() {
            let selectedItems = [];
            this.items?.forEach(item => {
                if (item.quantity > 0 && item.availability === 'Available') {
                    selectedItems.push(item)
                }
            });
            return selectedItems
        },
        // SubTotalA - Discounted Items Total
        subTotalA() {
            let subTotal = 0
            this.selectedItems?.forEach(item => {
                if (item.isDiscounted) {
                    subTotal += (item.price * item.quantity)
                }
            });
            return parseFloat(subTotal).toFixed(2)
        },
        discountAmount() {
            let total = 0
            let discountPercent = parseFloat(this.defaultDiscount) / 100
            if (this.isCouponApplied) {
                discountPercent = parseFloat(this.orderDetails.couponApplied.discountPercent) / 100
            }
            this.selectedItems.forEach(item => {
                if (item.isDiscounted) {
                    total += (item.price * item.quantity * discountPercent)
                }
            });
            return parseFloat(total).toFixed(2)
        },
        // SubTotalB - Discounted Items Less Total
        subTotalB() {
            return (parseFloat(this.subTotalA) - parseFloat(this.discountAmount)).toFixed(2)
        },
        nonDiscountTotal() {
            let subTotal = 0
            this.selectedItems?.forEach(item => {
                if (!item.isDiscounted) {
                    subTotal += (item.price * item.quantity)
                }
            });
            return parseFloat(subTotal).toFixed(2)
        },
        grandTotal() {
            return (parseFloat(this.subTotalB) + parseFloat(this.nonDiscountTotal)).toFixed(2)
        },
        hasFormErrors() {
            // Only check for errors, not for empty fields (let Quasar input handle required UI)
            return (
                !!this.mobileNumberError ||
                !!this.pincodeError 
            );
        },
    },
    async mounted() {
        await updateShopOpen();
        if (!SHOP_OPEN) {
            window.location.href = 'index.html'
        }
        reInitWebflow()
        if (!fbInitialized) {
            initFirebase()
            fbInitialized = true
        }
        // initFirebase()

        this.listData()

        // this.loadGapiClient()
    },
    methods: {

        openImage(imageUrl) {
            
            this.displayImageUrl = imageUrl
            this.showImageDialog = true
        },
        closeDialog(){
            this.showImageDialog = false
        },
        async scrollToTop() {
            setTimeout(() => {

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 10);

        },
        async getVendorEmail() {
            return new Promise(async (resolve, reject) => {
                try {

                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: VENDOR_EMAIL_RANGE,
                    });

                    let range = response.data

                    if (range.values.length > 0) {
                        VENDOR_EMAIL = range.values[0][0]
                        gotVendorEmail = true
                    }
                    resolve()
                } catch (error) {
                    console.log("Error getting vendor email:", error);
                    reject(error)
                }

            });
        },
        async listData() {
            try {
                this.getCoupons()
                this.getDefaultDiscount()
                this.getVendorEmail()
                if (this.isTermsAccepted) {
                    this.$q.loading.show({
                        spinnerColor: '#ffda6a',
                    })
                }
                await this.getCategories()
                await this.getItems()
                this.isItemsLoaded = true
                let productDiv = document.getElementById('products-body-container')
                productDiv.style.display = 'block'
                this.scrollToTop()
            } catch (error) {
                console.log("Error:", error)
                this.isItemsLoaded = false

            }

            this.$q.loading.hide()
        },

        async placeEnquiry() {
            if (!this.validateForm()) return;
            try {
                this.$q.loading.show({
                    spinnerColor: '#ffda6a',
                    message: 'Sending enquiry...'
                })
                // await this.getItemsForVerification()
                await this.setOrderDetails()
                // Generate and download PDF before dialog
                this.generateOrderPDF();
                // this.saveOrderToSheets(this.orderDetails)
                // this.saveLastBillNumberToSheets(this.orderDetails)
                // this.sendEnquiryPlacedMails();
                // this.$q.loading.hide()
                // this.$q.dialog({
                //     title: 'Enquiry placed',
                //     message: `Our Executive will call you shortly. Your Bill number is: ${this.orderDetails.billNumber}. Please check your bill number with contest 2025 to win exciting prizes… Thanks for ordering with JCS (your bill copy is sent to your email)`
                // }).onDismiss(async () => {
                //     this.scrollToTop()
                //     await this.resetAll();
                // })
            } catch (error) {
                console.log("Place enquiry error:", error);
                this.$q.dialog({
                    title: 'Enquiry failed',
                    message: `Please try again`
                })
                this.$q.loading.hide()

            }

        },
        acceptTerms() {
            this.isTermsAccepted = true;
            if (!this.isItemsLoaded) {
                this.$q.loading.show({
                    spinnerColor: '#ffda6a',
                })
            }
        },
        sendEnquiryPlacedMails() {
            return new Promise((resolve, reject) => {
                let iterationContent = ''
                this.orderDetails.items.forEach(item => {
                    iterationContent += `<table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-top: none; border-left: none; border-right: none;">
                    <tr>
                       <td align="left" valign="top" width="88%" style="width: 50%; max-width: 88%; min-width: 90px">
                          <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                          
                          <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 16px; line-height: 22px; font-weight: 600;">${item.name}</span>
                          
                             <div style="height: 2px; line-height: 2px; font-size: 1px;">&nbsp;</div>
                         
                             <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 13px; line-height: 20px;">${item.category}</span>
                             <div style="height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</div>
                         
                             <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 13px; line-height: 20px;">${item.pricePer}</span>
                         
                          <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                       </td>
                       <td width="7" style="width: 7px; max-width: 7px; min-width: 7px;">&nbsp;</td>
                       <td align="right" valign="top" width="12%" style="width: 12%; max-width: 12%; min-width: 70px">
                          <div style="height: 22px; line-height: 22px; font-size: 20px;">&nbsp;</div>
                          <font class="mob_name" face="'Source Sans Pro', sans-serif" color="#333333" style="font-size: 24px; line-height: 27px;">
                             <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;"></span></font><font class="mob_name" style="font-size: 24px; line-height: 27px;"><span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">${item.quantity}</span></font>
                          
                             <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                       </td>
                       <td align="right" valign="top" width="12%" style="width: 15%; max-width: 15%; min-width: 84px">
                          <div style="height: 22px; line-height: 22px; font-size: 20px;">&nbsp;</div>
                          <font class="mob_name" face="'Source Sans Pro', sans-serif" color="#333333" style="font-size: 24px; line-height: 27px;">
                             <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">₹</span></font><font class="mob_name" style="font-size: 24px; line-height: 27px;"><span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">${item.price}</span></font>
                          
                             <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                       </td>
                    </tr>
                 </table>`
                });
                let couponContent = ''
                let discountPercent = this.orderDetails.defaultDiscount
                if (this.orderDetails.couponApplied) {
                    discountPercent = this.orderDetails.couponApplied.discountPercent
                    couponContent = `<table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                    <tr>
                       <td align="center" valign="top">
                          <div style="height: 28px; line-height: 28px; font-size: 26px;">&nbsp;</div>
                          <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" style="width: 100% !important; max-width: 100%; min-width: 180px; background: #fce6a3; border-radius: 4px; padding: 12px;">
                             <tr><td align="center" valign="middle">
                             <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: black; font-size: 16px; line-height: 22px;">Coupon (${this.orderDetails.couponApplied.name}) applied successfully!</span>
                          </td>
                          </tr>
                          </table>
                       </td>
                    </tr>
                 </table>`
                }
                let mailBody = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
                <html>
                
                <head>
                   <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                   <title></title>
                   <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
                   <style type="text/css">
                      html {
                         -webkit-text-size-adjust: none;
                         -ms-text-size-adjust: none;
                         background: #f3f3f3;
                      }
                
                      @media only screen and (min-device-width: 650px) {
                         .table650 {
                            width: 650px !important;
                         }
                      }
                
                      @media only screen and (max-device-width: 650px),
                      only screen and (max-width: 650px) {
                         table[class="table650"] {
                            width: 100% !important;
                         }
                
                         .mob_b {
                            width: 93% !important;
                            max-width: 93% !important;
                            min-width: 93% !important;
                         }
                
                         .mob_b1 {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: 100% !important;
                         }
                
                         .mob_left {
                            text-align: left !important;
                         }
                
                         .mob_soc {
                            width: 50% !important;
                            max-width: 50% !important;
                            min-width: 50% !important;
                         }
                
                         .mob_menu {
                            width: 50% !important;
                            max-width: 50% !important;
                            min-width: 50% !important;
                            box-shadow: inset -1px -1px 0 0 rgba(255, 255, 255, 0.2);
                         }
                
                         .top_pad {
                            height: 15px !important;
                            max-height: 15px !important;
                            min-height: 15px !important;
                         }
                
                         .mob_pad {
                            width: 15px !important;
                            max-width: 15px !important;
                            min-width: 15px !important;
                         }
                
                         .top_pad2 {
                            height: 40px !important;
                            max-height: 40px !important;
                            min-height: 40px !important;
                         }
                
                         .min_pad {
                            height: 16px !important;
                            max-height: 16px !important;
                            min-height: 16px !important;
                         }
                
                         .min_pad2 {
                            height: 28px !important;
                            max-height: 28px !important;
                            min-height: 26px !important;
                         }
                
                         .mob_title1 {
                            font-size: 36px !important;
                            line-height: 40px !important;
                         }
                
                         .mob_title2 {
                            font-size: 26px !important;
                            line-height: 33px !important;
                         }
                
                         .mob_name {
                            font-size: 17px !important;
                            line-height: 20px !important;
                         }
                
                      }
                
                      @media only screen and (max-device-width: 600px),
                      only screen and (max-width: 600px) {
                         .mob_div {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: 100% !important;
                         }
                
                         .mob_tab {
                            width: 88% !important;
                            max-width: 88% !important;
                            min-width: 88% !important;
                         }
                      }
                
                      @media only screen and (max-device-width: 550px),
                      only screen and (max-width: 550px) {
                         .mod_div {
                            display: block !important;
                         }
                
                         .mob_btn {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: 100% !important;
                         }
                      }
                
                      .table650 {
                         width: 650px;
                      }
                   </style>
                </head>
                
                <body style="margin: 0; padding: 0;">
                
                   <table cellpadding="0" cellspacing="0" border="0" width="100%"
                      style="background: #f3f3f3; min-width: 350px; font-size: 1px; line-height: normal;">
                      <tr>
                         <td align="center" valign="top">
                            <!--[if (gte mso 9)|(IE)]>
                         <table border="0" cellspacing="0" cellpadding="0">
                         <tr><td align="center" valign="top" width="650"><![endif]-->
                            <table cellpadding="0" cellspacing="0" border="0" width="650" class="table650"
                               style="width: 100%; max-width: 650px; min-width: 350px; background: #f3f3f3;">
                               <tr>
                                  <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                                  <td align="center" valign="top" style="background: #ffffff;">
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="100%"
                                        style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                                        <tr>
                                           <td align="right" valign="top">
                                              <div class="top_pad" style="height: 25px; line-height: 25px; font-size: 23px;">&nbsp;
                                              </div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 88%;">
                                        <tr>
                                           <td align="left" valign="top">
                                              <div style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
                                              <!-- <a href="#" target="_blank" style="display: block; max-width: 100px;"> -->
                                              <!-- <img src="images/industry-logo-2x.png" alt="img" width="60" border="0" style="display: block;" /> -->
                                              <span
                                                 style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif;font-size:32px; color:#31018a; text-decoration-line: none;font-weight: 700;">JCS
                                                 Crackers</span>
                                              <!-- </a> -->
                                              <div class="top_pad2" style="height: 50px; line-height: 50px; font-size: 50px;">&nbsp;
                                              </div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 90%;">
                                        <tr>
                                           <td align="left" valign="top" class="mob_title1"
                                              style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 24px; font-weight: normal; letter-spacing: -1.5px;">
                                              Bill No. : ${this.orderDetails.billNumber}
                                              <div style="height: 12px; line-height: 12px; font-size: 12px;">&nbsp;</div>
                                           </td>
                                        </tr>
                                        <tr>
                                           <td align="left" valign="top"
                                              style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 16px;">
                                              <span style="font-size: 20px;">${this.orderDetails.fullName}</span><br></strong>
                                              <div style="height: 10px; line-height: 10px; font-size: 38px;">&nbsp;</div>
                                              <span style="font-size: 14px;">
                                                 ${this.orderDetails.address.replace('\n', '<br>')} <br>
                                                 ${this.orderDetails.pincode} <br>
                                                 ${this.orderDetails.mobileNumber} <br>
                                                 ${this.orderDetails.email} <br>
                                              </span>
                                              <div style="height: 30px; line-height: 30px; font-size: 38px;">&nbsp;</div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 88%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-top: none; border-left: none; border-right: none;">
                                        <tr>
                                           <td align="left" valign="top" width="17%"
                                              style="width: 17%; max-width: 17%; min-width: 20px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                
                                              Product
                
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                           </td>
                                           <td width="10" style="width: 10px; max-width: 10px; min-width: 10px;">&nbsp;</td>
                                           <td align="left" valign="top" width="67%"
                                              style="width: 67%; max-width: 67%; min-width: 90px">&nbsp;</td>
                                           <td width="7" style="width: 7px; max-width: 7px; min-width: 7px;">&nbsp;</td>
                                           <td align="right" valign="top" width="12%"
                                              style="width: 12%; max-width: 12%; min-width: 70px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                              Qty
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                           </td>
                                           <td align="right" valign="top" width="12%"
                                              style="width: 15%; max-width: 15%; min-width: 84px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                              Price
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                           </td>
                                        </tr>
                                     </table>
                
                
                                     <!-- Items -->
                                     ${iterationContent}
                                     <!-- Coupon Block START -->
                                     ${couponContent}
                
                                     <!-- Coupon Block ENDS -->
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 88%;">
                                        <tr>
                                           <td align="left" valign="top">
                                              <div style="height: 28px; line-height: 28px; font-size: 26px;">&nbsp;</div>
                                              <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" width="180"
                                                 style="width: 100% !important; max-width: 100%; min-width: 180px; background: #31018a; border-radius: 4px; padding: 12px;">
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Sub Total (A) : ₹ ${this.orderDetails.subTotalA}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Discount (${discountPercent}% OFF) : ₹ ${this.orderDetails.discountAmount}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="justify" valign="middle" height="1" bgcolor="white"></td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Sub Total (B) : ₹ ${this.orderDetails.subTotalB}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Non Discounted Items : ₹ ${this.orderDetails.nonDiscountTotal}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="justify" valign="middle" height="1" bgcolor="white"></td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="bottom" height="36">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffda6a; font-size: 20px; line-height: 24px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Grand Total : ₹ ${this.orderDetails.grandTotal}
                                                       </span>
                                                    </td>
                                                 </tr>
                                              </table>
                                              <div class="min_pad2" style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;
                                              </div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="100%"
                                        style="width: 100% !important; min-width: 100%; max-width: 100%; background: #999999;">
                                        <tr>
                                           <td align="center" valign="top">
                                              <div style="height: 34px;">&nbsp;</div>
                
                                              <div style="height: 15px;">&nbsp;</div>
                                              <font face="'Source Sans Pro', sans-serif" color="#ffffff"
                                                 style="font-size: 14px;line-height: 22px; "> Thank you for ordering from JCS
                                                 Crackers!<br> "Your Joy is Our Pride" </font>
                
                
                                              <div style="height: 34px;">&nbsp;</div>
                
                                              <div style="height: 34px;">&nbsp;</div>
                                        </tr>
                                     </table>
                                  </td>
                               </tr>
                            </table>
                
                         </td>
                         <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                      </tr>
                   </table>
                   <!--[if (gte mso 9)|(IE)]>
                         </td></tr>
                         </table><![endif]-->
                   </td>
                   </tr>
                   </table>
                </body>
                
                </html>`





                const sendMailOverHTTP = firebase.app().functions('us-central1').httpsCallable('sendMailOverHTTP')


                var vendorSubject = `Enquiry from ${this.orderDetails.email}`;
                let vendorEmail = VENDOR_EMAIL;
                let fromEmail = `Cloud Cerebro <cloudcerebro.dev.09.2020@gmail.com>`;

                let vendorMail = {
                    fromEmail: fromEmail,
                    toEmail: vendorEmail,
                    subject: vendorSubject,
                    body: mailBody
                };

                var userSubject = `Enquiry placed in JCS Crackers`;
                let userEmail = this.orderDetails.email;

                let userMail = {
                    fromEmail: fromEmail,
                    toEmail: userEmail,
                    subject: userSubject,
                    body: mailBody
                };

                sendMailOverHTTP(vendorMail)
                    .then(vendorResult => {


                        sendMailOverHTTP(userMail)
                            .then(userResult => {
                                resolve();
                            })
                            .catch(userError => {
                                this.$q.dialog({
                                    title: 'Server busy',
                                    message: 'Please try again later'
                                })
                                reject()
                            })
                    })
                    .catch(vendorErr => {
                        this.$q.dialog({
                            title: 'Server busy',
                            message: 'Please try again later'
                        })
                        reject()

                    })




            });
        },

        async getCategories() {
            return new Promise(async (resolve, reject) => {
                try {

                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: CATEGORIES_RANGE,
                    });

                    let range = response.data
                    if (range.values.length > 0) {
                        for (i = 0; i < range.values.length; i++) {
                            let row = range.values[i];
                            this.categories.push(row[0])
                        }
                    }

                    resolve()
                } catch (error) {
                    console.log("Error getting categories:", error);
                    reject(error)
                }

            });
        },

        async getDefaultDiscount() {
            return new Promise(async (resolve, reject) => {
                try {

                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: DEFAULT_DISCOUNT_RANGE,
                    });

                    let range = response.data

                    if (range.values.length > 0) {
                        this.defaultDiscount = range.values[0][0]
                    }

                    resolve()
                } catch (error) {
                    console.log("Error getting coupons:", error);
                    reject(error)
                }

            });
        },
        async getCoupons() {
            return new Promise(async (resolve, reject) => {
                try {
                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: COUPONS_RANGE,
                    });

                    let range = response.data

                    if (range.values.length > 0) {
                        for (i = 0; i < range.values.length; i++) {
                            let row = range.values[i];
                            let coupon = {};
                            coupon.name = row[0];
                            coupon.discountPercent = row[1];
                            if (coupon.name && coupon.name.length > 0)
                                this.coupons.push(coupon);
                        }
                    }


                    resolve()
                } catch (error) {
                    console.log("Error getting coupons:", error);
                    reject(error)
                }
            });
        },
        async getItems() {
            return new Promise(async (resolve, reject) => {
                try {
                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: CRACKERS_RANGE,
                    });


                    let range = response.data





                    if (range.values.length > 0) {

                        for (i = 0; i < range.values.length; i++) {
                            let item = {}
                            var row = range.values[i];
                            // Print columns A and E, which correspond to indices 0 and 4.

                            item.category = row[0]
                            item.name = row[1]
                            item.price = row[2]
                            item.pricePer = row[3]
                            item.imageId = row[4]
                            item.imageUrl = row[5]
                            item.isDiscounted = row[6] === 'Discount' ? true : false
                            item.availability = row[7]
                            item.quantity = 0

                            if (item.category && item.name && item.price && item.pricePer && item.availability) {
                                this.items.push(item)
                            }
                        }


                    } else {
                        console.log("No data found:",);
                    }
                    resolve()
                } catch (error) {
                    console.log("Error getting items:", error);
                    reject(error)
                }
            });
        },




        saveOrderToSheets(orderDetails) {
            return new Promise(async (resolve, reject) => {

                let itemList = ``
                orderDetails.items.forEach(item => {
                    itemList = itemList + `${item.name} x ${item.quantity}\n`


                });

                let data = {
                    sheetId: SHEET_ID,
                    range: ORDERS_RANGE,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'OVERWRITE',
                    body: {
                        values: [
                            [
                                orderDetails.billNumber,
                                orderDetails.fullName,
                                orderDetails.email,
                                orderDetails.mobileNumber,
                                orderDetails.address,
                                orderDetails.pincode,
                                itemList,
                                `${orderDetails.defaultDiscount}%`,
                                orderDetails.coupon,
                                orderDetails.coupon ? `${orderDetails.couponApplied?.discountPercent}%` : '',
                                orderDetails.subTotalA,
                                orderDetails.discountAmount,
                                orderDetails.subTotalB,
                                orderDetails.nonDiscountTotal,
                                orderDetails.grandTotal,
                                orderDetails.giftClaimed,
                                orderDetails.id
                            ]
                        ]
                    }
                }
                appendDataToSheetsApi(data)
                    .then((result) => {

                        resolve()
                    })
                    .catch((error) => {
                        console.log("Write error:", error);
                        reject(error);
                    })
            })
        },
        saveLastBillNumberToSheets(orderDetails) {
            return new Promise(async (resolve, reject) => {


                let data = {
                    sheetId: SHEET_ID,
                    range: LAST_BILL_NUMBER_RANGE,
                    valueInputOption: 'USER_ENTERED',
                    body: {
                        values: [[`${orderDetails.billNumber}`]]
                    }
                }

                addDataToSheetsApi(data)
                    .then((result) => {

                        resolve()
                    })
                    .catch((error) => {
                        console.log("Write error:", error);
                        reject(error);
                    })
            })
        },
        validateForm() {
            if (this.orderDetails.fullName.length < 2) {
                this.$q.dialog({
                    title: 'Full Name',
                    message: 'Enter a valid full name'
                })
                return false;
            }
            if (this.orderDetails.address.length < 10) {
                this.$q.dialog({
                    title: 'Address',
                    message: 'Enter a valid address'
                })
                return false;
            }
            if (this.orderDetails.pincode.length != 6) {
                this.$q.dialog({
                    title: 'Pincode',
                    message: 'Enter a valid pincode'
                })
                return false;
            }
            if (this.orderDetails.mobileNumber.length != 10) {
                this.$q.dialog({
                    title: 'Mobile Number',
                    message: 'Enter a valid mobile number'
                })
                return false;
            }
            if (!validateEmail(this.orderDetails.email)) {
                this.$q.dialog({
                    title: 'Email',
                    message: 'Enter a valid email'
                })
                return false;
            }
            if (this.selectedItems.length === 0) {
                this.$q.dialog({
                    title: 'Add items',
                    message: 'Please add items before submitting'
                })
                return false;
            }
            if (this.grandTotal < MINIMUM_ORDER_AMOUNT) {
                this.$q.dialog({
                    title: 'Add more items',
                    message: `Minimum order should be above ${MINIMUM_ORDER_AMOUNT}`
                })
                return false;
            }
            return true;
        },
        setOrderDetails() {
            return new Promise(async (resolve, reject) => {
                let lastBillNumber = await this.getLastBillNumber();


                let nextBillNumber = this.generateNextBillNumber(lastBillNumber);

                this.applyCoupon()
                if (!this.isCouponApplied) {
                    this.orderDetails.coupon = ""
                } else {
                    this.orderDetails.coupon = this.orderDetails.coupon.toUpperCase()
                }
                this.orderDetails.defaultDiscount = this.defaultDiscount
                this.orderDetails.billNumber = nextBillNumber;
                this.orderDetails.id = uuidv4();
                this.orderDetails.items = this.selectedItems;
                this.orderDetails.subTotalA = this.subTotalA
                this.orderDetails.discountAmount = this.discountAmount;
                this.orderDetails.subTotalB = this.subTotalB
                this.orderDetails.nonDiscountTotal = this.nonDiscountTotal
                this.orderDetails.grandTotal = this.grandTotal
                resolve()
            });
        },
        async getLastBillNumber() {
            return new Promise(async (resolve, reject) => {
                try {

                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: LAST_BILL_NUMBER_RANGE,
                    });

                    let range = response.data
                    let lastBillNumber = null
                    if (range.values.length > 0) {
                        lastBillNumber = range.values[0][0]
                    }


                    resolve(lastBillNumber)
                } catch (error) {
                    console.log("Error getting last bill number:", error);
                    reject(error)
                }

            });
        },
        generateNextBillNumber(lastBillNumber) {
            let letterPart = lastBillNumber.slice(0, 1)
            let numberPart = parseInt(lastBillNumber.slice(1, lastBillNumber.length))
            let newNumberPart = (numberPart + 1).toString().padStart(4, "0")
            let newLetterPart = letterPart
            if (numberPart === 9999) {
                newNumberPart = (1).toString().padStart(4, "0")
                newLetterPart = letterPart.substring(0, letterPart.length - 1)
                    + String.fromCharCode(letterPart.charCodeAt(letterPart.length - 1) + 1)
            }
            let newBillNumber = newLetterPart + newNumberPart


            return newBillNumber;

        },


        async resetAll() {
            return new Promise((resolve, reject) => {
                this.items.forEach(item => {
                    item.quantity = 0;
                });
                this.isCouponApplied = false;
                this.isCouponInvalid = false;

                this.orderDetails = {
                    id: null,
                    fullName: '',
                    address: '',
                    pincode: '',
                    mobileNumber: '',
                    email: '',
                    defaultDiscount: '',
                    coupon: '',
                    couponApplied: null,
                    giftClaimed: false,
                    billNumber: null,
                    items: [],
                    subTotalA: null,
                    discountAmount: null,
                    subTotalB: null,
                    nonDiscountTotal: null,
                    grandTotal: null,
                }
            });
        },
        async getItemsForVerification() {
            return new Promise(async (resolve, reject) => {
                try {


                    let response = await getDataFromSheetsApi({
                        sheetId: SHEET_ID,
                        range: CRACKERS_RANGE,
                    });

                    let range = response.data
                    let newItems = []
                    if (range.values.length > 0) {

                        for (i = 0; i < range.values.length; i++) {
                            let item = {}
                            var row = range.values[i];
                            // Print columns A and E, which correspond to indices 0 and 4.

                            item.category = row[0]
                            item.name = row[1]
                            item.price = row[2]
                            item.pricePer = row[3]
                            item.imageId = row[4]
                            item.imageUrl = row[5]
                            item.isDiscounted = row[6] === 'Discount' ? true : false
                            item.availability = row[7]
                            item.quantity = 0

                            if (item.category && item.name && item.price && item.pricePer && item.availability) {
                                newItems.push(item)
                                this.updateItem(item)
                            }
                        }





                    } else {
                        console.log("No data found:",);
                    }
                    resolve()
                } catch (error) {
                    console.log("Error getting items:", error);
                    reject(error)
                }
            });
        },
        updateItem(newItem) {
            this.items.forEach(item => {
                if (item.category === newItem.category && item.name === newItem.name) {
                    item.price = newItem.price;
                    item.pricePer = newItem.pricePer;
                    item.imageUrl = newItem.imageUrl;
                    item.isDiscounted = newItem.isDiscounted;
                    if (item.availability != newItem.availability) {
                        item.availability = newItem.availability;
                        item.quantity = 0
                    }
                }
            });
        },

        addItem(itemIndex) {
            this.items[itemIndex].quantity++
        },
        removeItem(itemIndex) {
            this.items[itemIndex].quantity--
        },
        applyCoupon() {
            if (!this.orderDetails.coupon || this.orderDetails.coupon.length === 0) {
                this.isCouponApplied = false;
                this.isCouponInvalid = false;
                return
            }
            let couponFound = false;
            this.coupons.forEach(coupon => {
                if (coupon.name.toUpperCase() == this.orderDetails.coupon.toUpperCase()) {
                    couponFound = coupon;
                }
            });

            if (couponFound) {
                this.isCouponApplied = true;
                this.isCouponInvalid = false;
                this.orderDetails.couponApplied = couponFound
            } else {
                this.isCouponInvalid = true;
                this.isCouponApplied = false;
            }
        },
        validateMobileNumber() {
            const v = this.orderDetails.mobileNumber;
            if (!v) {
                this.mobileNumberError = 'Mobile number is required';
            } else if (!/^[6-9]\d{9}$/.test(v)) {
                this.mobileNumberError = 'Enter a valid mobile number';
            } else {
                this.mobileNumberError = null;
            }
        },
        validatePincode() {
            const v = this.orderDetails.pincode;
            if (!v) {
                this.pincodeError = 'Pin code is required';
                return;
            } else if (!/^[0-9]{6}$/.test(v)) {
                this.pincodeError = 'Enter a valid 6-digit pin code';
                return;
            } else {
                // South Indian state detection
                const prefix = v.toString().slice(0, 2);
                const stateMap = {
                    'Tamil Nadu': ['60', '61', '62', '63', '64'],
                    'Kerala': ['67', '68', '69'],
                    'Karnataka': ['56', '57', '58', '59'],
                    'Telangana': ['50', '51', '52'],
                    'Andhra Pradesh': ['50', '51', '52', '53']
                };
                let valid = false;
                for (const codes of Object.values(stateMap)) {
                    if (codes.includes(prefix)) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pincodeError = 'Unknown or unsupported state';
                } else {
                    this.pincodeError = null;
                }
            }
        },


        generateOrderPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const order = this.orderDetails;
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 50;

            // Draw outer border for the bill
            doc.setLineWidth(1.5);
            doc.rect(20, 20, pageWidth - 40, 770, 'S');
            doc.setLineWidth(0.8);

            // Centered Header Block: ESTIMATE, JCS Crackers, Address
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('ESTIMATE', pageWidth / 2, y, { align: 'center' });
            y += 22;
            doc.setFontSize(18);
            doc.text('JCS Crackers', pageWidth / 2, y, { align: 'center' });
            y += 20;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('3/1421, Sivakamipuram Colony, Near RSR Petrol Pump, Sivakasi', pageWidth / 2, y, { align: 'center' });
            y += 32;

            // Enquiry No, Date, Email, Mobile (left/right aligned, below header block)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Enquiry No : ${order.billNumber || ''}`, 30, y);
            doc.text(`Date : ${new Date().toLocaleDateString()}`, pageWidth - 40, y, { align: 'right' });
            y += 18;
            doc.text('Mobile : 9500211527', 30, y);
            doc.text('E-mail : jcscrackersandtraders@gmail.com', pageWidth - 40, y, { align: 'right' });
            y += 30;

            // Customer Details (left)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Customer Details', 30, y);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.fullName || ''}`, 30, y + 14);
            doc.text(`${order.address || ''}`, 30, y + 28);
            doc.text(`${order.pincode || ''}`, 30, y + 42);
            doc.text(`${order.mobileNumber || ''}`, 30, y + 56);
            doc.text(`${order.email || ''}`, 30, y + 70);

            // Account Details Box (right)
            // const boxX = pageWidth - 270;
            // const boxY = y;
            // const boxWidth = 220;
            // const boxHeight = 90;
            // doc.setLineWidth(1);
            // doc.rect(boxX, boxY, boxWidth, boxHeight, 'S');
            // // Vertically center the text block
            // const numLines = 5;
            // const lineHeight = 14;
            // const textBlockHeight = numLines * lineHeight;
            // const topPadding = (boxHeight - textBlockHeight) / 2;
            // let accY = boxY + topPadding + lineHeight - 2;
            // doc.setFont('helvetica', 'bold');
            // doc.text('A/C Name :', boxX + 10, accY);
            // doc.setFont('helvetica', 'normal');
            // doc.text('Sri Sanjeev Agencies', boxX + 90, accY);
            // accY += lineHeight;
            // doc.setFont('helvetica', 'bold');
            // doc.text('A/C Number :', boxX + 10, accY);
            // doc.setFont('helvetica', 'normal');
            // doc.text('50200052459422', boxX + 90, accY);
            // accY += lineHeight;
            // doc.setFont('helvetica', 'bold');
            // doc.text('A/C Type :', boxX + 10, accY);
            // doc.setFont('helvetica', 'normal');
            // doc.text('CURRENT', boxX + 90, accY);
            // accY += lineHeight;
            // doc.setFont('helvetica', 'bold');
            // doc.text('Bank Name :', boxX + 10, accY);
            // doc.setFont('helvetica', 'normal');
            // doc.text('HDFC', boxX + 90, accY);
            // accY += lineHeight;
            // doc.setFont('helvetica', 'bold');
            // doc.text('IFSC Code :', boxX + 10, accY);
            // doc.setFont('helvetica', 'normal');
            // doc.text('HDFC0001860', boxX + 90, accY);

            y += 110; // More vertical space before table

            // Table Columns
            const columns = [
                { header: 'S.No', dataKey: 'sno' },
                // { header: 'Code', dataKey: 'code' },
                { header: 'Product Name', dataKey: 'name' },
                { header: 'Qty', dataKey: 'qty' },
                { header: 'Rate / Qty', dataKey: 'rate' },
                { header: 'Discount', dataKey: 'discount' },
                { header: 'Final Rate', dataKey: 'finalRate' },
                { header: 'Amount', dataKey: 'amount' },
            ];

            // Table Rows
            const discountPercent = this.isCouponApplied && order.couponApplied ? parseFloat(order.couponApplied.discountPercent) : parseFloat(this.defaultDiscount);
            const rows = (order.items || []).map((item, idx) => {
                const price = parseFloat(item.price);
                const discount = item.isDiscounted ? (price * discountPercent / 100) : 0;
                const finalRate = price - discount;
                return {
                    sno: idx + 1,
                    code: '', // No code in data, leave blank
                    name: item.name,
                    qty: item.quantity,
                    rate: price.toFixed(2),
                    discount: discount ? discount.toFixed(2) : '',
                    finalRate: finalRate.toFixed(2),
                    amount: (finalRate * item.quantity).toFixed(2),
                };
            });

            // Table with bold grid lines
            doc.autoTable({
                startY: y,
                head: [columns.map(col => col.header)],
                body: rows.map(row => columns.map(col => row[col.dataKey])),
                theme: 'grid',
                headStyles: { fillColor: [200, 200, 200], fontStyle: 'bold', halign: 'center', lineWidth: 1.2 },
                bodyStyles: { fontSize: 10, cellPadding: 6, lineWidth: 1.2 },
                styles: { cellPadding: 6, fontSize: 10, lineWidth: 1.2, lineColor: [0, 0, 0] },
                margin: { left: 24, right: 24 },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 32 }, // S.No
                    // 1: { halign: 'center', cellWidth: 40 }, // Code (if used)
                    1: { cellWidth: 240 }, // Product Name (wider)
                    2: { halign: 'center', cellWidth: 32 }, // Qty
                    3: { halign: 'right', cellWidth: 60 }, // Rate / Qty
                    4: { halign: 'right', cellWidth: 60 }, // Discount
                    5: { halign: 'right', cellWidth: 60 }, // Final Rate
                    6: { halign: 'right', cellWidth: 60 }, // Amount
                },
                didDrawCell: function (data) {
                    // Make header bottom border thicker
                    if (data.row.section === 'head' && data.column.index === 0) {
                        const { table, cell } = data;
                        data.doc.setLineWidth(1.5);
                        data.doc.line(cell.x, cell.y + cell.height, cell.x + cell.width * table.columns.length, cell.y + cell.height);
                        data.doc.setLineWidth(1.2);
                    }
                },
            });

            let tableY = doc.lastAutoTable.finalY + 32; // More space after table
            const totalsX = pageWidth - 220;
            const valueX = pageWidth - 60;

            // Totals block (right-aligned, bold labels)
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Sub Total', totalsX, tableY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.subTotalA || '0.00'}`, valueX, tableY, { align: 'right' });
            tableY += 18;
            doc.setFont('helvetica', 'bold');
            doc.text('Discount', totalsX, tableY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.discountAmount || '0.00'}`, valueX, tableY, { align: 'right' });
            tableY += 18;
            doc.setFont('helvetica', 'bold');
            doc.text('Non Discounted Items', totalsX, tableY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.nonDiscountTotal || '0.00'}`, valueX, tableY, { align: 'right' });
            tableY += 18;
            doc.setFont('helvetica', 'bold');
            doc.text('Grand Total', totalsX, tableY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.grandTotal || '0.00'}`, valueX, tableY, { align: 'right' });
            tableY += 24;
            doc.setFont('helvetica', 'bold');
            doc.text(`Overall Total`, totalsX, tableY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.grandTotal || '0.00'}`, valueX, tableY, { align: 'right' });

            // Total Items (left-aligned, bold)
            let leftY = doc.lastAutoTable.finalY + 32;
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Items : ${(order.items || []).length}`, 30, leftY);
            leftY += 28;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text('Thank you for placing your enquiry', 30, leftY);

            doc.save(`JCSCrackers_Estimate_${order.billNumber || ''}.pdf`);
        },
    },
    // ...etc
})