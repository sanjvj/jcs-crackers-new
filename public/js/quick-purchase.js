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
      segments: [
        { id: "segment_1", percent: 10, start: 0, end: 36, name: "Get 5% Off" },
        { id: "segment_2", percent: 8, start: 36, end: 72, name: "Get 30 Shot as free" },
        { id: "segment_3", percent: 7, start: 72, end: 108, name: "Get 4 Fancy pipe one free" },
        { id: "segment_4", percent: 6, start: 108, end: 144, name: "Try again" },
        { id: "segment_5", percent: 5, start: 144, end: 180, name: "Get 2026 welcome kit free" },
        { id: "segment_6", percent: 13, start: 180, end: 216, name: "Better Luck Next time" },
        { id: "segment_7", percent: 15, start: 216, end: 252, name: "Get 25 Holi Joli shot free" },
        { id: "segment_8", percent: 20, start: 252, end: 288, name: "Get 2 Bijili Bag free" },
        { id: "segment_9", percent: 12, start: 288, end: 324, name: "Get Free Delivery" },
        { id: "segment_10", percent: 4, start: 324, end: 360, name: "Get Sliver Gift box free" }
      ],
      targetPercents: {
        "Get 5% Off": 10,
        "Get 30 Shot as free": 8,
        "Get 4 Fancy pipe one free": 7,
        "Try again": 6,
        "Get 2026 welcome kit free": 5,
        "Better Luck Next time": 13,
        "Get 25 Holi Joli shot free": 15,
        "Get 2 Bijili Bag free": 20,
        "Get Free Delivery": 12,
        "Get Sliver Gift box free": 4
      },
      newsegments: [
        { id: "segment_1", percent: 10, start: 0, end: 36, name: "Get 5% Off" },
        { id: "segment_2", percent: 8, start: 36, end: 72, name: "Get 30 Shot as free" },
        { id: "segment_3", percent: 7, start: 72, end: 108, name: "Get 4 Fancy pipe one free" },
        { id: "segment_4", percent: 6, start: 108, end: 144, name: "Try again" },
        { id: "segment_5", percent: 5, start: 144, end: 180, name: "Get 2026 welcome kit free" },
        { id: "segment_6", percent: 13, start: 180, end: 216, name: "Better Luck Next time" },
        { id: "segment_7", percent: 15, start: 216, end: 252, name: "Get 25 Holi Joli shot free" },
        { id: "segment_8", percent: 20, start: 252, end: 288, name: "Get 2 Bijili Bag free" },
        { id: "segment_9", percent: 12, start: 288, end: 324, name: "Get Free Delivery" },
        { id: "segment_10", percent: 4, start: 324, end: 360, name: "Get Sliver Gift box free" }
      ],
      currentRotation: 0,
      spinCount: 0,
      isResetting: false,
      today: new Date().toISOString().split('T')[0],
            spinprize: '',
            spinprizeid: '',
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
        // New: All Items Total (discounted + non-discounted)
        allItemsTotal() {
            let total = 0;
            this.selectedItems?.forEach(item => {
                total += (item.price * item.quantity);
            });
            return parseFloat(total).toFixed(2);
        },
        spinDiscountAmount() {
            const prizeData = JSON.parse(localStorage.getItem("spinprize") || "{}");

              if (prizeData.name) {
                this.spinprize = prizeData.name;
              }
              if (prizeData.id) {
                this.spinprizeid = prizeData.id;
              }

            let discount = '';
            const today = new Date().toISOString().split("T")[0];
            if (prizeData.date === today && (prizeData.status == 0 || prizeData.status == '0')) {
                if (this.spinprizeid !== 'segment_4' && this.spinprizeid !== 'segment_6') {
                  discount = this.spinprize; 
                }
            }
            return discount;
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
        this.getCurrentSegmentName();
        this.getCurrentSegmentPercentage();
        this.checkPrize();
        this.listData()

        // this.loadGapiClient()
    },
    methods: {

        
        async getCurrentSegmentName() {
          return new Promise(async (resolve, reject) => {
            try {
              let response = await getDataFromSheetsApi({
                sheetId: SHEET_ID,
                range: CURRENT_SEGMENTS_NAME,
              });

              let range = response.data;
              if (range.values.length > 0) {
                for (let i = 0; i < range.values.length; i++) {
                  let value = range.values[i][0]; 
                  if (this.segments[i]) {
                    this.segments[i].name = value;
                  }
                }
              }
              this.newsegments = this.segments;
              console.log(this.segments);
              resolve();
            } catch (error) {
              console.log("Error getting coupons:", error);
              reject(error);
            }
          });
        },

        
        async getCurrentSegmentPercentage() {
          return new Promise(async (resolve, reject) => {
            try {
              let response = await getDataFromSheetsApi({
                sheetId: SHEET_ID,
                range: CURRENT_SEGMENTS_PERCENTAGE,
              });

              let range = response.data;
                console.log(this.segments[1].percent);
              if (range.values.length > 0) {
                for (let i = 0; i < range.values.length; i++) {
                  let value = parseFloat(range.values[i][0]); // first col of row i
                  if (!isNaN(value) && this.segments[i]) {
                    this.segments[i].percent = value;
                  }
                }
              }
              console.log(this.segments[1].percent);
              resolve();
            } catch (error) {
              console.log("Error getting coupons:", error);
              reject(error);
            }
          });
        },
        async checkPrize() {
            const prizeData = JSON.parse(localStorage.getItem('spinprize') || '{}')
            let spinwheelstatus = await this.getSpinwheelcontestatus();
            if (prizeData.date !== this.today && spinwheelstatus == 'yes') {
              document.querySelector('.spin-popup_container').style.display = 'grid';
              document.body.style.overflow = 'hidden';
            }
        },
        async fetchSpinPrizeCounts() {
          // const sheetId = SHEET_ID;
          // const range = ORDERS_RANGE;

          // const response = await fetch(
          //   `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=YOUR_API_KEY`
          // );

          const response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: ORDERS_RANGE,
          });
          
          
          const data = response.data;
          const rows = data.values || [];

          const counts = {};
          const prizeColumnIndex = 17;

          rows.forEach((row) => {
            const prize = row[prizeColumnIndex];
            if (prize) {
              counts[prize] = (counts[prize] || 0) + 1;
            }
          });
          return counts;
        },

        

        async getPrizeByQuota() {
          const totalPercent = this.segments.reduce((sum, seg) => sum + seg.percent, 0);

          let rand = Math.random() * totalPercent;

          for (const seg of this.segments) {
            rand -= seg.percent;
            if (rand <= 0) {
              return seg; 
            }
          }

          return this.segments[0];
        },

        async spinWheel() {
          if (this.isResetting) return;

          const selected = await this.getPrizeByQuota();

          const centerOffset = (selected.end - selected.start) / 2;
          const targetAngle = selected.start + centerOffset;

          const fullRotations = 6 * 360;
          this.currentRotation += fullRotations + (360 - targetAngle);

          const wheel = document.getElementById("inner-wheel");
          wheel.style.transform = `rotate(${this.currentRotation}deg)`;
          wheel.style.transition = "all 6s cubic-bezier(0, .99, .44, .99)";

          setTimeout(() => {
            document.getElementById("spinedprize").innerText = selected.name;
            document.querySelector(".result-area").style.display = "block";

            localStorage.setItem(
              "spinprize",
              JSON.stringify({
                name: selected.name,
                id: selected.id,
                date: this.today,
                status: 0,
              })
            );

            if (selected.id === "segment_4") {
              console.log("User got Try again → spinning again...");
              let prizeData = JSON.parse(localStorage.getItem("spinprize") || "{}");
                prizeData.name = '';
                prizeData.id = '';
                prizeData.date = '';
                prizeData.status = 0;
                localStorage.setItem("spinprize", JSON.stringify(prizeData));
              location.reload();
              return; 
            }

            if (selected.id !== "segment_6") {
              this.triggerCrackerEffect(5000);
            }

            setTimeout(() => {
              document.querySelector(".spin-popup_container").style.display =
                "none";
              document.body.style.overflow = "auto";
            }, 5000);
          }, 6002);
        },

        triggerCrackerEffect(duration = 3000) {
          const gif = document.getElementById('crackerImage');
          const gif2 = document.getElementById('crackerImage2');
          const audio = document.getElementById('crackerAudio');

          gif.style.display = 'block';
          gif.classList.remove('replay');
          void gif.offsetWidth;
          gif.classList.add('replay');

          gif2.style.display = 'block';
          gif2.classList.remove('replay');
          void gif2.offsetWidth;
          gif2.classList.add('replay');

          audio.currentTime = 0;
          audio.play();

          setTimeout(() => {
            gif.style.display = 'none';
            gif2.style.display = 'none';
            audio.pause();
            audio.currentTime = 0;
          }, duration);
        },

        onFullNameChange(newValue) {
          const prizeData = JSON.parse(localStorage.getItem("spinprize") || "{}");

          if (prizeData.name) {
            this.spinprize = prizeData.name;
          }
          if (prizeData.id) {
            this.spinprizeid = prizeData.id;
          }

          //console.log("Prize Name:", this.spinprize);
          //console.log("Prize ID:", this.spinprizeid);
        },
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
                await this.getItemsForVerification()
                await this.setOrderDetails()

                console.log('User prize:', this.spinprize);

                let prizeData = JSON.parse(localStorage.getItem("spinprize") || "{}");
                prizeData.status = 1;
                localStorage.setItem("spinprize", JSON.stringify(prizeData));

                if(this.spinDiscountAmount !== ''){
                    this.orderDetails.prize = this.spinprize;
                }else{                    
                    this.orderDetails.prize = '';
                }

                // Generate and download PDF before dialog
                this.generateOrderPDF();
                this.saveOrderToSheets(this.orderDetails)
                this.saveLastBillNumberToSheets(this.orderDetails)
                this.sendEnquiryPlacedMails();
                this.$q.loading.hide()
                this.$q.dialog({
                    title: 'Enquiry placed',
                    message: `Our Executive will call you shortly. Your Bill number is: ${this.orderDetails.billNumber}. Please check your bill number with contest 2025 to win exciting prizes… Thanks for ordering with JCS (your bill copy is sent to your email)`
                }).onDismiss(async () => {
                    this.scrollToTop()
                    await this.resetAll();
                })
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
              const order = this.orderDetails;
              const discountPercent = this.isCouponApplied && order.couponApplied
                ? parseFloat(order.couponApplied.discountPercent)
                : parseFloat(this.defaultDiscount);
          
              // Generate table rows for email
              let tableRows = '';
              let customindex = 0;
              order.items.forEach((item, idx) => {
                const price = parseFloat(item.price);
                const discount = item.isDiscounted ? (price * discountPercent / 100) : 0;
                const finalRate = price - discount;
                const amount = (finalRate * item.quantity).toFixed(2);
          
                tableRows += `
                  <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 6px; text-align: center; font-family: Arial, sans-serif; font-size: 11px;">${idx + 1}</td>
                    <td style="padding: 6px; font-family: Arial, sans-serif; font-size: 11px;">${item.name}</td>
                    <td style="padding: 6px; text-align: center; font-family: Arial, sans-serif; font-size: 11px;">${item.quantity}</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">${price.toFixed(2)}</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">${discount.toFixed(2)}</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">${finalRate.toFixed(2)}</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">${amount}</td>
                  </tr>`;
                  customindex = idx + 1;
              });
            console.log(this.spinprize);
              if (this.spinprize && this.spinDiscountAmount !== '') {
                tableRows += `
                    <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 6px; text-align: center; font-family: Arial, sans-serif; font-size: 11px;">${customindex + 1}</td>
                    <td style="padding: 6px; font-family: Arial, sans-serif; font-size: 11px;">🎁 Spin Gift: ${this.spinprize}</td>
                    <td style="padding: 6px; text-align: center; font-family: Arial, sans-serif; font-size: 11px;">1</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">0</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">0</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">0</td>
                    <td style="padding: 6px; text-align: right; font-family: Arial, sans-serif; font-size: 11px;">0</td>
                    </tr>`;
                } 
                
                let spincountincrease = 0;
                if(this.spinprize && this.spinDiscountAmount !== ''){
                    spincountincrease = 1;
                }

                let couponhtml = '';
                if (order.coupon && order.coupon.length > 0) {
                    couponhtml = `<p style=""><strong>Discount code applied:</strong> ${order.coupon}</p>`;
                }

                let spinhtml = '';
                if (this.spinprize && spincountincrease) {
                    spinhtml = `<p style=""><strong>Spin prize:</strong> ${this.spinprize && spincountincrease ? this.spinprize : '-'}</p>`;
                }

              let mailBody = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background: #fff;
                    padding: 20px;
                    color: #333;
                  }
                  .container {
                    max-width: 750px;
                    margin: 0 auto;
                  }
                  .header {
                    text-align: center;
                  }
                  .header h1 {
                    font-size: 20px;
                    color: #31018a;
                    margin: 5px 0;
                  }
                  .header h2 {
                    font-size: 16px;
                    margin: 5px 0;
                  }
                  .header p {
                    font-size: 12px;
                    margin: 5px 0;
                    color: #800080;
                  }
                  .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    font-size: 12px;
                    margin-bottom: 20px;
                    row-gap: 4px;
                  }
                  .info-item {
                    padding: 2px 0;
                  }
                  .box-wrapper {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    gap: 10px;
                  }
                  .box {
                    width: 100%;
                    border: 1px solid #ccc;
                    padding: 12px;
                    font-size: 12px;
                    box-sizing: border-box;
                  }
                  .box h3 {
                    margin-top: 0;
                    font-size: 13px;
                    margin-bottom: 8px;
                  }
                  .account-title {
                    color: #800080;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin-bottom: 20px;
                  }
                  th, td {
                    border: 1px solid #ddd;
                    padding: 6px;
                  }
                  th {
                    background: #f2f2f2;
                    text-align: center;
                  }
                  .summary-table {
                    margin-left: auto;
                    width: auto;
                    font-size: 12px;
                  }
                  .summary-table td {
                    padding: 4px 8px;
                    text-align: right;
                  }
                  .summary-table td:first-child {
                    text-align: left;
                  }
                  .footer {
                    text-align: center;
                    font-size: 12px;
                    margin-top: 20px;
                  }
                  .highlight {
                    font-weight: bold;
                  }
                  a {
                    color: #31018a;
                    text-decoration: none;
                  }
                </style>
              </head>
              <body style="font-family: Arial, sans-serif;background: #fff;padding:0px;color: #333;">
                <div class="container" style="max-width: 750px;margin: 0 auto;">
                  <!-- Header -->
                  <div class="header" style="text-align: center;">
                    <h1 style="font-size: 20px;color: #31018a;margin: 5px 0;">ESTIMATE</h1>
                    <h2 style="font-size: 16px;margin: 5px 0;">JCS Crackers</h2>
                    <p style="font-size: 12px;margin: 5px 0;color: #800080;">3/1421, Sivakamipuram Colony, Near RSR Petrol Pump, Sivakasi</p>
                  </div>
              
                  <!-- Info Row -->
                  <div class="info-grid" style="display: grid;grid-template-columns: 1fr 1fr;font-size: 12px;margin-bottom: 20px;row-gap: 4px;">
                    <div class="info-item" style="padding: 2px 0;"><strong>Enquiry No:</strong> ${order.billNumber}</div>
                    <div class="info-item" style="padding: 2px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                    <div class="info-item" style="padding: 2px 0;"><strong>Mobile:</strong> ${order.mobileNumber}</div>
                    <div class="info-item" style="padding: 2px 0;"><strong>Email:</strong> <a styles="color: #31018a;text-decoration: none;" href="mailto:jcscrackersandtraders@gmail.com">jcscrackersandtraders@gmail.com</a></div>
                  </div>
              
                    <table style="width: 100%; border-spacing: 10px; margin-bottom: 10px;">
                    <tr>
                        <!-- Customer Box -->
                        <td style="width: 50%; vertical-align: top; border: 1px solid #ccc; padding: 12px; font-size: 12px;">
                        <h3 style="margin-top: 0; font-size: 13px;">Customer Details</h3>
                        <p>${order.fullName}</p>
                        <p>${order.address}</p>
                        <p>${order.pincode}</p>
                        <p>${order.mobileNumber}</p>
                        <p><a styles="color: #31018a;text-decoration: none;" href="mailto:${order.email}">${order.email}</a></p>
                        </td>

                        <!-- Account Box -->
                        <td style="width: 50%; vertical-align: top; border: 1px solid #ccc; padding: 12px; font-size: 12px;">
                        <h3 style="margin-top: 0; font-size: 13px; color: #800080;">Account Details</h3>
                        <p><strong>A/C Name:</strong> Sri Sanjeev Agencies</p>
                        <p><strong>A/C Number:</strong> 50200052459422</p>
                        <p><strong>A/C Type:</strong> CURRENT</p>
                        <p><strong>Bank:</strong> HDFC</p>
                        <p><strong>IFSC:</strong> HDFC0001860</p>
                        </td>
                    </tr>
                    </table>



              
                  <!-- Product Table -->
                  <table style="width: 100%;border-collapse: collapse;font-size: 11px;margin-bottom: 10px;">
                    <thead style="">
                      <tr style="">
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">S.No</th>
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">Product Name</th>
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">Qty</th>
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">Rate / Qty</th>
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">Discount</th>
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">Final Rate</th>
                        <th style="border: 1px solid #ddd;padding: 6px;background: #f2f2f2;text-align: center;">Amount</th>
                      </tr>
                    </thead>
                    <tbody style="">
                      ${tableRows}
                    </tbody>
                  </table>
              
                  <!-- Summary Table -->
                  <table class="summary-table" style="margin-left: auto;width: auto;font-size: 12px;">
                    <tr style=""><td style="padding: 4px 8px;text-align: right;">Sub Total</td><td>₹${this.subTotalA}</td></tr>
                    <tr style=""><td style="padding: 4px 8px;text-align: right;">Discount</td><td>₹${order.discountAmount || '0.00'}</td></tr>
                    <tr style=""><td style="padding: 4px 8px;text-align: right;">Non Discounted Items</td><td>₹${order.nonDiscountTotal || '0.00'}</td></tr>
                    <tr style=""><td style="padding: 4px 8px;text-align: right;" class="highlight" style="font-weight: bold;">Grand Total</td><td class="highlight">₹${order.grandTotal || '0.00'}</td></tr>
                    <tr style=""><td style="padding: 4px 8px;text-align: right;" class="highlight" style="font-weight: bold;">Overall Total</td><td class="highlight">₹${order.grandTotal || '0.00'}</td></tr>
                    <tr style=""><td style="padding: 4px 8px;text-align: right;" class="highlight" style="font-weight: bold;">Total Items</td><td class="highlight">${order.items.length + (this.spinprize && spincountincrease ? 1 : 0)}</td></tr>
                  </table>
              
                  <!-- Footer -->
                  <div class="footer" style="text-align: left;font-size: 12px;margin-top: 10px;"> 
                    ${couponhtml}
                    ${spinhtml}
                    <p style="">Thank you for placing your order</p>
                  </div>
                </div>
              </body>
              </html>
              `;

                this.setDefaultSpinPercentage();

              const sendMailOverHTTP = firebase.app().functions('us-central1').httpsCallable('sendMailOverHTTP');
              
              const pdfFile = this.generateMailPDF();

              let fromEmail = `Cloud Cerebro <cloudcerebro.dev.09.2020@gmail.com>`;
              let vendorEmail = VENDOR_EMAIL;
          
              const vendorMail = {
                fromEmail,
                toEmail: vendorEmail,
                subject: `Enquiry from ${order.email}`,
                body: mailBody,
                attachments: []
              };
          
              const userMail = {
                fromEmail,
                toEmail: order.email,
                subject: `Enquiry placed in JCS Crackers`,
                body: mailBody,
                  attachments: [
                    {
                      filename: `JCSCrackers_Estimate_${
                        order.billNumber || "enquiry"
                      }.pdf`,
                      content: pdfFile,
                      encoding: "base64",
                    },
                  ],
              };
          
              sendMailOverHTTP(vendorMail)
                .then(() => sendMailOverHTTP(userMail))
                .then(() => sendMailOverHTTP(vendorMail))
                .then(() => resolve())
                .catch(() => {
                  this.$q.dialog({
                    title: 'Server busy',
                    message: 'Please try again later'
                  });
                  reject();
                });
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

        async getSpinwheelcontestatus() {
              try {
                console.log("started");
                let response = await getDataFromSheetsApi({
                  sheetId: SHEET_ID,
                  range: SPINWHEEL_CONTEST,
                });

                let range = response.data;
                console.log(range);
                let spinwheelstatus = "";
                if (range.values.length > 0) {
                  spinwheelstatus = range.values[0][0];
                }

                return spinwheelstatus;
              } catch (error) {
                console.log("Error getting spin:", error);
              }
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

        

        async setDefaultSpinPercentage() {
          return new Promise(async (resolve, reject) => {
            try {
              let response = await getDataFromSheetsApi({
                sheetId: SHEET_ID,
                range: SPIN_SEGMENTS, 
              });

              let range = response.data;
              
              if (range.values.length > 0 && this.spinprize) {
                let prizes = range.values.map((r) => r[0]);
                let index = prizes.indexOf(this.spinprize);

                if (index !== -1) {
                  console.log("Matched prize:", this.spinprize, "at index:", index);

                  let percentageresponse = await getDataFromSheetsApi({
                    sheetId: SHEET_ID,
                    range: CURRENT_SEGMENTS_PERCENTAGE,
                  });

                  let percentagerange = percentageresponse.data;

                  if (percentagerange.values.length > 0) {
                    let currentpercentage =
                      parseFloat(percentagerange.values[index][0]) || 0;
                    let newpercentage = currentpercentage - 0.1;

                    console.log(
                      "Current percentage:",
                      currentpercentage,
                      "New:",
                      newpercentage
                    );

                    let targetRange = `Contest!E${index + 2}`; 
                    await addDataToSheetsApi({
                      sheetId: SHEET_ID,
                      range: targetRange,
                      valueInputOption: "USER_ENTERED",
                      body: {
                        values: [[newpercentage]],
                      },
                    });

                    console.log("Percentage updated at:", targetRange);
                  }
                } else {
                  console.log("Spin prize not found in segments.");
                }
              }

              resolve();
            } catch (error) {
              console.log("Error getting coupons:", error);
              reject(error);
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
                let orderprize = '';
                if(this.spinprize && this.spinDiscountAmount !== ''){
                    orderprize = this.spinprize;
                }else{
                    orderprize = '';
                }

                    console.log(SHEET_ID);
                    console.log('placeoredersheet2'+ ' '+ORDERS_RANGE);
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
                                orderDetails.id,
                                orderprize
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
        
            // Main border
            doc.setLineWidth(1.5);
            doc.rect(20, 20, pageWidth - 40, 770, 'S');
            doc.setLineWidth(0.8);
        
            // Header
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
            doc.text(`Mobile : ${order.mobileNumber || ''}`, 30, y);
            doc.text('E-mail : jcscrackersandtraders@gmail.com', pageWidth - 40, y, { align: 'right' });
            y += 40; // More space after enquiry info section
        
            // Customer Details and Account Details - Perfectly aligned boxes
            const customerBoxX = 30;
            const accountBoxX = pageWidth - 290; // Move further right for better spacing
            const boxY = y;
            const boxWidth = 260; // Same width for both boxes
            const boxHeight = 130; // Fixed height for both boxes

            // Customer Details Box (left) - with prominent border
            doc.setLineWidth(2); // Thicker border
            doc.rect(customerBoxX, boxY, boxWidth, boxHeight, 'S');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Customer Details', customerBoxX + 10, boxY + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(`${order.fullName || ''}`, customerBoxX + 10, boxY + 30);
            //doc.text(`${order.address || ''}`, customerBoxX + 10, boxY + 44);
            const addressText = doc.splitTextToSize(`${order.address || ""}`, boxWidth - 20);
            doc.text(addressText, customerBoxX + 10, boxY + 44);
            doc.text(`${order.pincode || ''}`, customerBoxX + 10, boxY + 85);
            doc.text(`${order.mobileNumber || ''}`, customerBoxX + 10, boxY + 100);
            doc.text(`${order.email || ''}`, customerBoxX + 10, boxY + 112);

            // Account Details Box (right) - identical structure and spacing
            doc.rect(accountBoxX, boxY, boxWidth, boxHeight, 'S');
            doc.setFont('helvetica', 'bold');
            doc.text('Account Details', accountBoxX + 10, boxY + 15);
            doc.setFont('helvetica', 'normal');
            doc.text('A/C Name : Sri Sanjeev Agencies', accountBoxX + 10, boxY + 30);
            doc.text('A/C Number : 50200052459422', accountBoxX + 10, boxY + 44);
            doc.text('A/C Type : CURRENT', accountBoxX + 10, boxY + 58);
            doc.text('Bank Name : HDFC', accountBoxX + 10, boxY + 72);
            doc.text('IFSC Code : HDFC0001860', accountBoxX + 10, boxY + 86);

            y += boxHeight + 30; // Space after both boxes
        
            // Product Table
            const columns = [
                { header: 'S.No', dataKey: 'sno' },
                { header: 'Product Name', dataKey: 'name' },
                { header: 'Qty', dataKey: 'qty' },
                { header: 'Rate / Qty', dataKey: 'rate' },
                { header: 'Discount', dataKey: 'discount' },
                { header: 'Final Rate', dataKey: 'finalRate' },
                { header: 'Amount', dataKey: 'amount' },
            ];
        
            const discountPercent = this.isCouponApplied && order.couponApplied
                ? parseFloat(order.couponApplied.discountPercent)
                : parseFloat(this.defaultDiscount);
        
            const rows = (order.items || []).map((item, idx) => {
                const price = parseFloat(item.price);
                const discount = item.isDiscounted ? (price * discountPercent / 100) : 0;
                const finalRate = price - discount;
                return {
                    sno: idx + 1,
                    name: item.name,
                    qty: item.quantity,
                    rate: price.toFixed(2),
                    discount: discount.toFixed(2),
                    finalRate: finalRate.toFixed(2),
                    amount: (finalRate * item.quantity).toFixed(2),
                };
            });

            if(this.spinprize && this.spinDiscountAmount !== ''){
                rows.push({
                    sno: rows.length + 1,
                    name: `Spin Gift: ${this.spinprize}`,
                    qty: '1',
                    rate: '0.00',
                    discount: '0.00',
                    finalRate: '0.00',
                    amount: '0.00',
                });
            }
        
            doc.autoTable({
                startY: y,
                head: [columns.map(col => col.header)],
                body: rows.map(row => columns.map(col => row[col.dataKey])),
                theme: 'grid',
                headStyles: { 
                    fillColor: [200, 200, 200], 
                    fontStyle: 'bold', 
                    halign: 'center', 
                    lineWidth: 1.2 
                },
                bodyStyles: { 
                    fontSize: 10, 
                    cellPadding: 6, 
                    lineWidth: 1.2 
                },
                styles: { 
                    cellPadding: 6, 
                    fontSize: 10, 
                    lineWidth: 1.2, 
                    lineColor: [0, 0, 0] 
                },
                margin: { left: 24, right: 24 },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 32 },
                    1: { cellWidth: 240 },
                    2: { halign: 'center', cellWidth: 32 },
                    3: { halign: 'right', cellWidth: 60 },
                    4: { halign: 'right', cellWidth: 60 },
                    5: { halign: 'right', cellWidth: 60 },
                    6: { halign: 'right', cellWidth: 60 },
                },
                didDrawCell: function (data) {
                    if (data.row.section === 'head' && data.column.index === 0) {
                        const { table, cell } = data;
                        data.doc.setLineWidth(1.5);
                        data.doc.line(cell.x, cell.y + cell.height, cell.x + cell.width * table.columns.length, cell.y + cell.height);
                        data.doc.setLineWidth(1.2);
                    }
                },
            });
        
            // Totals section
            let tableY = doc.lastAutoTable.finalY + 32; // More space after table
        
            // Totals block (right-aligned, bold labels)

            const rightMargin = 30;  
            const tableWidth = 180;
            const valueColWidth = 60;
            const labelColWidth = tableWidth - valueColWidth;

            const totalsX = pageWidth - rightMargin - tableWidth;
            const valueX = totalsX + labelColWidth;

            const cellHeight = 18;
            const cellPadding = 4;

            const totalItemsCount = (order.items || []).length + (this.spinprize && this.spinDiscountAmount !== '' ? 1 : 0);

            const totals = [
                { label: 'Sub Total', value: this.subTotalA },
                { label: 'Discount', value: order.discountAmount || '0.00' },
                { label: 'Non Discounted Items', value: order.nonDiscountTotal || '0.00' },
                { label: 'Grand Total', value: order.grandTotal || '0.00' },
                { label: 'Overall Total', value: order.grandTotal || '0.00' },
                { label: 'Total Items', value: totalItemsCount || '0' },
            ];

            totals.forEach(row => {
                doc.rect(totalsX, tableY, labelColWidth, cellHeight, 'S');
                doc.setFont('helvetica', 'bold');
                doc.text(row.label, totalsX + cellPadding, tableY + cellHeight / 2 + 3);

                doc.rect(valueX, tableY, valueColWidth, cellHeight, 'S');
                doc.setFont('helvetica', 'normal');
                doc.text(`${row.value}`, valueX + valueColWidth - cellPadding, tableY + cellHeight / 2 + 3, { align: 'right' });

                tableY += cellHeight;
            });
        
            

        
            // Total Items (right-aligned with other totals for consistency)
            // tableY += 20;
            // doc.setFont('helvetica', 'bold');
            // doc.text(`Total Items`, totalsX, tableY);
            // doc.setFont('helvetica', 'normal');
            // doc.text(`${totalItemsCount}`, valueX, tableY, { align: 'right' });
            // If a coupon/discount code is applied, show it below the totals (left side)
            if (order.coupon && order.coupon.length > 0) {
                tableY += 28;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);

                const label = 'Discount code applied : ';
                const coupon = order.coupon;

                doc.text(label, 30, tableY);

                const labelWidth = doc.getTextWidth(label);

                doc.setFont('helvetica', 'normal');
                doc.text(coupon, 30 + labelWidth, tableY);
            }
            tableY += 28;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text('Thank you for placing your order', 30, tableY);
        
            doc.save(`JCSCrackers_Estimate_${order.billNumber || ''}.pdf`);
        },

        generateMailPDF() {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const order = this.orderDetails;
          const pageWidth = doc.internal.pageSize.getWidth();
          let y = 50;

          // Main border
          doc.setLineWidth(1.5);
          doc.rect(20, 20, pageWidth - 40, 770, "S");
          doc.setLineWidth(0.8);

          // Header
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("ESTIMATE", pageWidth / 2, y, { align: "center" });
          y += 22;
          doc.setFontSize(18);
          doc.text("JCS Crackers", pageWidth / 2, y, { align: "center" });
          y += 20;
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.text(
            "3/1421, Sivakamipuram Colony, Near RSR Petrol Pump, Sivakasi",
            pageWidth / 2,
            y,
            { align: "center" }
          );
          y += 32;

          // Enquiry No, Date, Email, Mobile (left/right aligned, below header block)
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Enquiry No : ${order.billNumber || ""}`, 30, y);
          doc.text(`Date : ${new Date().toLocaleDateString()}`, pageWidth - 40, y, {
            align: "right",
          });
          y += 18;
          doc.text(`Mobile : ${order.mobileNumber || ""}`, 30, y);
          doc.text("E-mail : jcscrackersandtraders@gmail.com", pageWidth - 40, y, {
            align: "right",
          });
          y += 40; // More space after enquiry info section

          // Customer Details and Account Details - Perfectly aligned boxes
          const customerBoxX = 30;
          const accountBoxX = pageWidth - 290; // Move further right for better spacing
          const boxY = y;
          const boxWidth = 260; // Same width for both boxes
          const boxHeight = 110; // Fixed height for both boxes

          // Customer Details Box (left) - with prominent border
          doc.setLineWidth(2); // Thicker border
          doc.rect(customerBoxX, boxY, boxWidth, boxHeight, "S");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text("Customer Details", customerBoxX + 10, boxY + 15);
          doc.setFont("helvetica", "normal");
          doc.text(`${order.fullName || ""}`, customerBoxX + 10, boxY + 30);
          doc.text(`${order.address || ""}`, customerBoxX + 10, boxY + 44);
          doc.text(`${order.pincode || ""}`, customerBoxX + 10, boxY + 58);
          doc.text(`${order.mobileNumber || ""}`, customerBoxX + 10, boxY + 72);
          doc.text(`${order.email || ""}`, customerBoxX + 10, boxY + 86);

          // Account Details Box (right) - identical structure and spacing
          doc.rect(accountBoxX, boxY, boxWidth, boxHeight, "S");
          doc.setFont("helvetica", "bold");
          doc.text("Account Details", accountBoxX + 10, boxY + 15);
          doc.setFont("helvetica", "normal");
          doc.text("A/C Name : Sri Sanjeev Agencies", accountBoxX + 10, boxY + 30);
          doc.text("A/C Number : 50200052459422", accountBoxX + 10, boxY + 44);
          doc.text("A/C Type : CURRENT", accountBoxX + 10, boxY + 58);
          doc.text("Bank Name : HDFC", accountBoxX + 10, boxY + 72);
          doc.text("IFSC Code : HDFC0001860", accountBoxX + 10, boxY + 86);

          y += boxHeight + 30; // Space after both boxes

          // Product Table
          const columns = [
            { header: "S.No", dataKey: "sno" },
            { header: "Product Name", dataKey: "name" },
            { header: "Qty", dataKey: "qty" },
            { header: "Rate / Qty", dataKey: "rate" },
            { header: "Discount", dataKey: "discount" },
            { header: "Final Rate", dataKey: "finalRate" },
            { header: "Amount", dataKey: "amount" },
          ];

          const discountPercent =
            this.isCouponApplied && order.couponApplied
              ? parseFloat(order.couponApplied.discountPercent)
              : parseFloat(this.defaultDiscount);

          const rows = (order.items || []).map((item, idx) => {
            const price = parseFloat(item.price);
            const discount = item.isDiscounted
              ? (price * discountPercent) / 100
              : 0;
            const finalRate = price - discount;
            return {
              sno: idx + 1,
              name: item.name,
              qty: item.quantity,
              rate: price.toFixed(2),
              discount: discount.toFixed(2),
              finalRate: finalRate.toFixed(2),
              amount: (finalRate * item.quantity).toFixed(2),
            };
          });

          if (this.spinprize && this.spinDiscountAmount !== '') {
            rows.push({
              sno: rows.length + 1,
              name: `Spin Gift: ${this.spinprize}`,
              qty: "1",
              rate: "0.00",
              discount: "0.00",
              finalRate: "0.00",
              amount: "0.00",
            });
          }

          doc.autoTable({
            startY: y,
            head: [columns.map((col) => col.header)],
            body: rows.map((row) => columns.map((col) => row[col.dataKey])),
            theme: "grid",
            headStyles: {
              fillColor: [200, 200, 200],
              fontStyle: "bold",
              halign: "center",
              lineWidth: 1.2,
            },
            bodyStyles: {
              fontSize: 10,
              cellPadding: 6,
              lineWidth: 1.2,
            },
            styles: {
              cellPadding: 6,
              fontSize: 10,
              lineWidth: 1.2,
              lineColor: [0, 0, 0],
            },
            margin: { left: 24, right: 24 },
            columnStyles: {
              0: { halign: "center", cellWidth: 32 },
              1: { cellWidth: 240 },
              2: { halign: "center", cellWidth: 32 },
              3: { halign: "right", cellWidth: 60 },
              4: { halign: "right", cellWidth: 60 },
              5: { halign: "right", cellWidth: 60 },
              6: { halign: "right", cellWidth: 60 },
            },
            didDrawCell: function (data) {
              if (data.row.section === "head" && data.column.index === 0) {
                const { table, cell } = data;
                data.doc.setLineWidth(1.5);
                data.doc.line(
                  cell.x,
                  cell.y + cell.height,
                  cell.x + cell.width * table.columns.length,
                  cell.y + cell.height
                );
                data.doc.setLineWidth(1.2);
              }
            },
          });

          // Totals section
          let tableY = doc.lastAutoTable.finalY + 32; // More space after table
         
          // Totals block (right-aligned, bold labels)
           const rightMargin = 30;  
            const tableWidth = 180;
            const valueColWidth = 60;
            const labelColWidth = tableWidth - valueColWidth;

            const totalsX = pageWidth - rightMargin - tableWidth;
            const valueX = totalsX + labelColWidth;

            const cellHeight = 18;
            const cellPadding = 4;

            const totalItemsCount = (order.items || []).length + (this.spinprize && this.spinDiscountAmount !== '' ? 1 : 0);

            const totals = [
                { label: 'Sub Total', value: this.subTotalA },
                { label: 'Discount', value: order.discountAmount || '0.00' },
                { label: 'Non Discounted Items', value: order.nonDiscountTotal || '0.00' },
                { label: 'Grand Total', value: order.grandTotal || '0.00' },
                { label: 'Overall Total', value: order.grandTotal || '0.00' },
                { label: 'Total Items', value: totalItemsCount || '0' },
            ];

            totals.forEach(row => {
                doc.rect(totalsX, tableY, labelColWidth, cellHeight, 'S');
                doc.setFont('helvetica', 'bold');
                doc.text(row.label, totalsX + cellPadding, tableY + cellHeight / 2 + 3);

                doc.rect(valueX, tableY, valueColWidth, cellHeight, 'S');
                doc.setFont('helvetica', 'normal');
                doc.text(`${row.value}`, valueX + valueColWidth - cellPadding, tableY + cellHeight / 2 + 3, { align: 'right' });

                tableY += cellHeight;
            });

          
          // Total Items (right-aligned with other totals for consistency)
          // tableY += 20;
          // doc.setFont("helvetica", "bold");
          // doc.text(`Total Items`, totalsX, tableY);
          // doc.setFont("helvetica", "normal");
          // doc.text(`${totalItemsCount}`, valueX, tableY, { align: "right" });
          // If a coupon/discount code is applied, show it below the totals (left side)
            if (order.coupon && order.coupon.length > 0) {
                tableY += 28;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);

                const label = 'Discount code applied : ';
                const coupon = order.coupon;

                doc.text(label, 30, tableY);

                const labelWidth = doc.getTextWidth(label);

                doc.setFont('helvetica', 'normal');
                doc.text(coupon, 30 + labelWidth, tableY);
            }

          tableY += 28;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          doc.text("Thank you for placing your order", 30, tableY);

          const pdfBase64 = doc.output("datauristring"); // full base64 with prefix
          const pdfFile = pdfBase64.split(",")[1];
          return pdfFile;
        },
    },
    // ...etc
})