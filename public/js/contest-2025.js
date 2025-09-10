
new Vue({
  el: '#q-contest-2025',
  data: function () {
    return {
      userBillNumber: ''
    }
  },
  created() {
    let displayDiv = document.getElementById('booking-closed-modal')
    displayDiv.style.display = 'none'


  },
  async mounted() {
    reInitWebflow()
    if (!fbInitialized) {
      initFirebase()
      fbInitialized = true
    }
    // initFirebase()
    if (!gotVendorEmail) {
      this.getVendorEmail()
    }
    let displayDiv = document.getElementById('booking-closed-modal')
    displayDiv.style.display = 'none'

    var inner = document.getElementById("inner-booking-closed-model");
    var closeButton = document.getElementById("close-quick-purchase")
    document.getElementById('booking-closed-modal').addEventListener("click", function (e) {
      if (e.target == inner) {
        // Outer
        displayDiv.style.display = 'none'
      } else {
        if (e.target == closeButton) {
          displayDiv.style.display = 'none'
        }
      }
    });
  },
  methods: {
    quickPurchaseClicked() {
      let displayDiv = document.getElementById('booking-closed-modal')
      if (SHOP_OPEN) {
        window.location.href = 'quick-purchase.html'
      } else {
        displayDiv.style.display = 'block'
      }
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
    getOrderRowNumberUsingBillNumber(userBillNumber) {
      return new Promise((resolve, reject) => {
        let data = {
          sheetId: SHEET_ID,
          range: ORDER_ROW_NUMBER_FOUND_RANGE,
          valueInputOption: 'USER_ENTERED',
          body: {
            values: [[`=MATCH("${userBillNumber}", Orders!A1:A, 0)`]]
          }
        }

        addDataToSheetsApi(data)
          .then((result) => {

            resolve(result.data.data.updatedData.values[0][0])
          })
          .catch((error) => {
            console.log("Write error:", error);
            reject(error);
          })
      });
    },
    getContestBillsRowNumberUsingBillNumber(userBillNumber) {
      return new Promise((resolve, reject) => {
        let data = {
          sheetId: SHEET_ID,
          range: CONTEST_BILLS_ROW_NUMBER_FOUND_RANGE,
          valueInputOption: 'USER_ENTERED',
          body: {
            values: [[`=MATCH("${userBillNumber}", Contest!A1:A, 0)`]]
          }
        }

        addDataToSheetsApi(data)
          .then((result) => {

            resolve(result.data.data.updatedData.values[0][0])
          })
          .catch((error) => {
            console.log("Write error:", error);
            reject(error);
          })
      });
    },
    changeGiftClaimStatusToTrue(foundOrderGiftClaimRange) {
      return new Promise((resolve, reject) => {

        let updateRange = foundOrderGiftClaimRange
        let data = {
          sheetId: SHEET_ID,
          range: foundOrderGiftClaimRange,
          valueInputOption: 'USER_ENTERED',
          body: {
            values: [[`TRUE`]]
          }
        }

        addDataToSheetsApi(data)
          .then((result) => {

            resolve(result)
          })
          .catch((error) => {
            console.log("Write error:", error);
            reject(error);
          })
      });
    },
    async getOrderDetailsOfFoundOrder(foundOrderRange) {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: foundOrderRange,
          });

          let range = response.data
          let orderDetails = {};
          if (range.values.length > 0) {
            orderDetails.billNumber = range.values[0][0]
            orderDetails.fullName = range.values[0][1]
            orderDetails.email = range.values[0][2]
            orderDetails.mobileNumber = range.values[0][3]
            orderDetails.giftClaimed = range.values[0][15]
            resolve(orderDetails)

          } else {
            reject("No matching order found");

          }
        } catch (error) {
          console.log("Error getting claim status:", error);
          reject(error)
        }
      });
    },
    submitBillNumber() {
      return new Promise(async (resolve, reject) => {
        this.$q.loading.show()
        try {
          if (this.userBillNumber.length != 5) {
            this.$q.loading.hide()
            this.$q.dialog({
              title: 'Contest 2025',
              message: 'Please enter a valid bill number'
            })
            return;
          }


          let orderRowNumber = await this.getOrderRowNumberUsingBillNumber(this.userBillNumber);

          if (orderRowNumber == '#N/A') {
            this.$q.loading.hide()
            this.$q.dialog({
              title: 'Contest 2025',
              message: 'Bill number not found'
            })
            this.userBillNumber = ''
            return;
          }

          let contestBillRowNumber = await this.getContestBillsRowNumberUsingBillNumber(this.userBillNumber);

          if (contestBillRowNumber == '#N/A') {
            this.$q.loading.hide()
            this.$q.dialog({
              title: 'Contest 2025',
              message: 'Better luck next time'
            })
            this.userBillNumber = ''
            return;
          }

          let foundOrderRange = `Orders!A${orderRowNumber}:Q${orderRowNumber}`

          let foundOrderDetails = await this.getOrderDetailsOfFoundOrder(foundOrderRange)

          // let giftClaimed = await this.getGiftClaimedStatus(foundOrderGiftClaimRange)


          let giftClaimed = foundOrderDetails.giftClaimed;
          if (giftClaimed.toLowerCase() === 'true') {
            giftClaimed = true
          } else {
            giftClaimed = false;
          }

          if (giftClaimed) {

            this.$q.loading.hide()
            this.$q.dialog({
              title: 'Contest 2025',
              message: 'Gift Box already claimed'
            })
            this.userBillNumber = ''
            return;

          }

          let foundOrderGiftClaimRange = `Orders!P${orderRowNumber}`

          await this.changeGiftClaimStatusToTrue(foundOrderGiftClaimRange)

          this.userBillNumber = ''
          this.$q.loading.hide()
          this.$q.dialog({
            title: 'Congratulations',
            message: 'You have won a lucky prize!'
          }).onDismiss(() => {
            this.sendGiftClaimedMail(foundOrderDetails)

          });

        } catch (error) {
          console.log("Error:", error);
          this.userBillNumber = ''
          this.$q.loading.hide()

        }



      });
    },
    sendGiftClaimedMail(orderDetails) {
      const sendMailOverHTTP = firebase.app().functions('us-central1').httpsCallable('sendMailOverHTTP')
      var subject = `Contest won by ${orderDetails.email}; Bill number: ${orderDetails.billNumber}`;
      let toEmail = VENDOR_EMAIL;
      let fromEmail = `Cloud Cerebro <cloudcerebro.dev.09.2020@gmail.com>`;



      var body = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
      <html>
      
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title></title>
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
        <style type="text/css">
          html {
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
      
          @media only screen and (min-device-width: 650px) {
            .table650 {
              width: 650px !important;
            }
          }
      
          @media only screen and (max-device-width: 650px),
          only screen and (max-width: 650px) {
            table .table650 {
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
      
            .mob_center {
              text-align: center !important;
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
      
            }
      
            .mob_pad {
              width: 15px !important;
              max-width: 15px !important;
              min-width: 15px !important;
            }
      
            .min_pad2 {
              height: 30px !important;
              max-height: 30px !important;
              min-height: 15px !important;
            }
      
            .top_pad {
              height: 15px !important;
              max-height: 15px !important;
              min-height: 15px !important;
            }
      
            .top_pad2 {
              height: 50px !important;
              max-height: 50px !important;
              min-height: 50px !important;
            }
      
            .mob_title1 {
              font-size: 36px !important;
              line-height: 40px !important;
            }
      
            .mob_title2 {
              font-size: 26px !important;
              line-height: 33px !important;
            }
      
            .mob_txt {
              font-size: 20px !important;
              line-height: 25px !important;
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
          style="background: #f3f3f3; min-width: 340px; font-size: 1px; line-height: normal;">
          <tr>
            <td align="center" valign="top">
              <!--[if (gte mso 9)|(IE)]>
               <table border="0" cellspacing="0" cellpadding="0">
               <tr><td align="center" valign="top" width="650"><![endif]-->
      
              <table cellpadding="0" cellspacing="0" border="0" width="650" class="table650"
                style="width: 100%; max-width: 650px; min-width: 340px; background: #f3f3f3;">
                <tr>
                  <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                  <td align="center" valign="top" style="background: #ffffff;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%"
                      style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                      <tr>
                        <td align="right" valign="top">
                          <div class="top_pad" style="height: 25px; line-height: 25px; font-size: 23px;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" width="90%"
                      style="width: 90% !important; min-width: 90%; max-width: 90%;">
                      <tr>
                        <td align="center" valign="top" class="mob_title1"
                          style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 32px; font-weight: 400; letter-spacing: -1.5px;">
                          <a href="jcs-crackers.web.app" target="_blank" style="text-decoration: none; color: inherit; ">
                            JCS Crackers
                          </a>
                        </td>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" border="0" width="80%"
                style="width: 80% !important; min-width: 80%; max-width: 80%;">
                <tr>
                  <td align="center" valign="top" class="mob_title1"
                    style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 32px; font-weight: 400; letter-spacing: -1.5px;">
                    Contest won by ${orderDetails.fullName}<div style="height: 20px;">&nbsp;</div>
                  </td>
                </tr>
      
                <td align="left" valign="top"
                  style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 18px;">
      
                  Bill Number: ${orderDetails.billNumber} <br>
      
                </td>
          </tr>
          <tr>
            <td align="center" valign="top"
              style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 18px;">
              <br>
            </td>
          </tr>
          <tr>
            <td align="left" valign="top"
              style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 18px;">
              ${orderDetails.fullName}, <br>
              ${orderDetails.email}<br>
              ${orderDetails.mobileNumber} <br>
      
            </td>
          </tr>
      
          <td align="center" valign="top"
            style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 14px; background-color: e6e6e6">
            <div style="height: 20px; line-height: 20px; font-size: 14px; ">&nbsp;
            </div>
            <br>
            <div style="height: 50px; line-height: 50px; font-size: 48px;">&nbsp;</div>
          </td>
          </tr>
        </table>
      
      
        </td>
        <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;<br></td>
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

      let mail = {
        fromEmail: fromEmail,
        toEmail: toEmail,
        subject: subject,
        body: body
      };



      sendMailOverHTTP(mail)
        .then(result => {
          return
        })
        .catch(err => {
          this.$q.dialog({
            title: 'Server busy',
            message: 'Please try again later'
          })
          return
        })





    }

  },
  // ...etc
})