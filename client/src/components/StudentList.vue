<template>
  <div class="StudentList">
    <img alt="SBS Attendance" id="SBS_logo" src="../assets/logo.png" />
    <img :src="image" alt="User image" id="user_image" v-if="image != ''" />
    <google-signin-btn :label="isSignedIn" @click="signIn" custom-class="signinButton" />
    <div>
      <input
        type="text"
        v-model="search"
        id="searchBox"
        @keyup.enter="enter(filteredStudents)"
        placeholder="Student name or ID"
        autofocus
      />
      <label for="event">Event type:</label>
      <select v-model="event" id="event">
        <option value="AB">1</option>
        <option value="CD">2</option>
        <option value="EF">3</option>
        <option value="GH">4</option>
        <option value="IJ">5</option>
      </select>
      <label for="grade">Student grade:</label>
      <select v-model="grade" id="grade" @change="setData" :disabled="isSignedIn == 'Sign In'">
        <option value disabled>Please select:</option>
        <option value="7">7th Grade</option>
        <option value="8">8th Grade</option>
        <option value="9">9th Grade</option>
        <option value="10">10th Grade</option>
        <option value="11">11th Grade</option>
        <option value="12">12th Grade</option>
      </select>
      <div>
        <input
          type="radio"
          name="gender"
          id="all"
          value
          v-model="gender"
          checked
          :disabled="isSignedIn == 'Sign In'"
        />
        <label for="all">All students</label>
        <input
          type="radio"
          name="gender"
          id="male"
          value="Male"
          v-model="gender"
          :disabled="isSignedIn == 'Sign In'"
        />
        <label for="male">Boys</label>
        <input
          type="radio"
          name="gender"
          id="female"
          value="Female"
          v-model="gender"
          :disabled="isSignedIn == 'Sign In'"
        />
        <label for="female">Girls</label>
      </div>
    </div>
    <button
      type="submit"
      v-if="students && students.length && isSignedIn == 'Sign Out'"
      id="submitButton"
      @click="submit"
    >Submit</button>
    <div id="remainingStudents" v-if="students && students.length && isSignedIn == 'Sign Out'">
      <div
        v-for="(student, index) in filteredStudents"
        :key="index"
        @click="attended(student)"
        class="students"
      >
        <img
          :src="'https://bbk12e1-cdn.myschoolcdn.com/ftpimages/935/user/' + student.large_filename"
          :alt="student.name"
          class="student_image"
        />
        <span class="student_name">{{student.name}}</span>
      </div>
    </div>
    <div id="checkedStudents" v-if="students && students.length && isSignedIn == 'Sign Out'">
      <div
        v-for="(student, index) in checkedStudents"
        :key="index"
        @click="undo(student)"
        class="students"
      >
        <img
          :src="'https://bbk12e1-cdn.myschoolcdn.com/ftpimages/935/user/' + student.large_filename"
          :alt="student.name"
          class="student_image"
        />
        <span class="student_name">{{student.name}}</span>
      </div>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
export default {
  name: "StudentList",
  data: function() {
    return {
      isSignedIn: "",
      search: "",
      gender: "",
      grade: "",
      image: "",
      students: [],
      event: "AB"
    };
  },
  methods: {
    signIn: function() {
      this.$gapi.isSignedIn().then(result => {
        if (!result) {
          this.$gapi
            .signIn()
            .then(user => {
              alert("Signed in as " + user.name + ".");
              this.image = user.image;
              this.isSignedIn = "Sign Out";
              this.getData().then(result => {
                if (
                  localStorage.getItem("students") &&
                  localStorage.getItem("students") != JSON.stringify(result)
                ) {
                  if (
                    confirm(
                      "You have attendace that is not saved. Do you want to continue taking the previous attendance?"
                    )
                  ) {
                    this.students = JSON.parse(localStorage.students);
                  } else if (this.grade != "") {
                    this.students = result;
                  }
                } else if (this.grade != "") {
                  this.students = result;
                }
              });
            })
            .catch(err => {
              alert("Error: " + err.error + ".");
            });
        } else {
          this.$gapi.signOut().then(() => {
            alert("User signed out.");
            this.image = "";
            this.isSignedIn = "Sign In";
          });
        }
      });
      document.getElementById("searchBox").focus();
    },
    convertJSON: function(lines) {
      var result = [];
      var headers = lines[0];

      for (let i = 1; i < lines.length; i++) {
        var obj = {};
        var currentline = lines[i];
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j].replace(/( |-)/g, "_").toLowerCase()] = currentline[j];
        }
        if (obj.nickname == "") {
          obj.name = obj.first_name + " " + obj.last_name;
        } else {
          obj.name = obj.nickname + " " + obj.last_name;
        }
        obj.isPresent = false;
        obj.presentTime = "";
        [
          "user_id",
          "first_name",
          "last_name",
          "thumb_filename",
          "role",
          "e_mail",
          "nickname"
        ].forEach(item => delete obj[item]);
        result.push(obj);
      }
      return result;
    },
    getData: function() {
      return this.$gapi
        .request({
          path:
            "https://sheets.googleapis.com/v4/spreadsheets/1TQjA6ZdRGgQpH2phhl3Mz1HaM8nQQ8YoKQJLCuPqoGs/values/Sheet1",
          method: "GET"
        })
        .then(
          response => {
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth();
            var gradYear;
            if (month >= 7) {
              year++;
            }
            switch (this.grade) {
              case "7":
                gradYear = (year + 5).toString();
                break;

              case "8":
                gradYear = (year + 4).toString();
                break;

              case "9":
                gradYear = (year + 3).toString();
                break;

              case "10":
                gradYear = (year + 2).toString();
                break;

              case "11":
                gradYear = (year + 1).toString();
                break;

              case "12":
                gradYear = year.toString();
                break;
            }
            return this.convertJSON(response.result.values).filter(
              student => student.grad_year == gradYear
            );
          },
          reason => {
            alert("Error: " + reason.result.error.message);
          }
        );
    },
    setData: function() {
      this.getData().then(result => {
        this.students = result;
      });
    },
    getTime: function() {
      var date = new Date();
      var hour = String(date.getHours()).padStart(2, "0");
      var minute = String(date.getMinutes()).padStart(2, "0");
      var second = String(date.getSeconds()).padStart(2, "0");
      date = hour + ":" + minute + ":" + second;
      return date;
    },
    attended: function(student) {
      this.students[this.students.indexOf(student)].isPresent = true;
      this.students[
        this.students.indexOf(student)
      ].presentTime = this.getTime();
      this.update();
    },
    enter: function(filteredStudents) {
      if (filteredStudents[0]) {
        this.students[
          this.students.indexOf(filteredStudents[0])
        ].isPresent = true;
        this.students[
          this.students.indexOf(filteredStudents[0])
        ].presentTime = this.getTime();
      }
      this.search = "";
      this.update();
    },
    undo: function(student) {
      this.students[this.students.indexOf(student)].isPresent = false;
      this.students[this.students.indexOf(student)].presentTime = "";
      this.update();
    },
    update: function() {
      localStorage.setItem("students", JSON.stringify(this.students));
      this.socket.emit("student-update", {
        grade: this.grade,
        event: this.event,
        students: this.students
      });
    },
    writeData: function(names, data) {
      this.$gapi
        .request({
          path: `https://sheets.googleapis.com/v4/spreadsheets/1hf-s8uJXXTP_-XsXm8PtRQhsks48a-CWGtlEtroIzm4/values/${this.grade}th-Grade!${this.event[0]}:${this.event[0]}?valueInputOption=RAW`,
          method: "PUT",
          body: {
            range: `${this.grade}th-Grade!${this.event[0]}:${this.event[0]}`,
            majorDimension: "ROWS",
            values: names
          }
        })
        .then(() => {
          this.$gapi.request({
            path:
              "https://sheets.googleapis.com/v4/spreadsheets/1hf-s8uJXXTP_-XsXm8PtRQhsks48a-CWGtlEtroIzm4/values:batchUpdate",
            method: "POST",
            body: {
              valueInputOption: "RAW",
              data: data
            }
          });
        })
        .then(() => {
          alert("Submitted successfully.");
        })
        .catch(reason => {
          alert("Error: " + reason.result.error.message);
        });
    },
    submit: function() {
      var date = new Date();
      var day = String(date.getDate()).padStart(2, "0");
      var month = String(date.getMonth() + 1).padStart(2, "0");
      var year = date.getFullYear();
      date = month + "/" + day + "/" + year;
      var names = [[date]];
      this.students.forEach(element => {
        names.push([element.name]);
      });
      var data = [
        {
          range: `${this.grade}th-Grade!${this.event[1]}1`,
          majorDimension: "ROWS",
          values: [[(this.event[0].toLowerCase().charCodeAt(0) - 97) / 2 + 1]]
        }
      ];
      this.students.forEach(element => {
        if (element.isPresent) {
          data.push({
            range: `${this.grade}th-Grade!${
              this.event[1]
            }${this.students.indexOf(element) + 2}`,
            majorDimension: "ROWS",
            values: [[element.presentTime]]
          });
        }
      });
      if (
        confirm(
          `Are you sure that you want to submit attendance for ${this.grade}th grade?`
        )
      ) {
        this.$gapi
          .request({
            path: `https://sheets.googleapis.com/v4/spreadsheets/1hf-s8uJXXTP_-XsXm8PtRQhsks48a-CWGtlEtroIzm4/values/${this.grade}th-Grade`,
            method: "GET"
          })
          .then(
            response => {
              var index = this.event[0].toLowerCase().charCodeAt(0) - 97;
              if (
                response.result.values == undefined ||
                response.result.values[0][index] != date
              ) {
                this.$gapi
                  .request({
                    path: `https://sheets.googleapis.com/v4/spreadsheets/1hf-s8uJXXTP_-XsXm8PtRQhsks48a-CWGtlEtroIzm4/values/${this.grade}th-Grade!${this.event[1]}:${this.event[1]}:clear`,
                    method: "POST"
                  })
                  .then(this.writeData(names, data))
                  .catch(reason => {
                    alert("Error: " + reason.result.error.message);
                  });
              } else {
                this.writeData(names, data);
              }
            },
            reason => {
              alert("Error: " + reason.result.error.message);
            }
          );
      }
      this.setData();
      this.update();
    }
  },
  computed: {
    filteredStudents: function() {
      return this.students.filter(student => {
        return (
          (student.name.toLowerCase().match(this.search.toLowerCase()) ||
            student.student_id.match(this.search)) &&
          student.gender.match(this.gender) &&
          student.isPresent == false
        );
      });
    },
    checkedStudents: function() {
      return this.students.filter(student => {
        return student.gender.match(this.gender) && student.isPresent == true;
      });
    }
  },
  mounted() {
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "";
    });
    this.socket = io();
    this.socket.on("student-update", data => {
      if (data.grade == this.grade && data.event == this.event) {
        this.students = data.students;
        localStorage.setItem("students", JSON.stringify(this.students));
      }
    });
    this.grade = localStorage.getItem("grade") || "";
    this.gender = localStorage.getItem("gender") || "";
    this.event = localStorage.getItem("event") || "AB";
    var search = document.getElementById("searchBox");
    var all = document.getElementById("all");
    var male = document.getElementById("male");
    var female = document.getElementById("female");
    var grade = document.getElementById("grade");
    function focus() {
      search.focus();
    }
    all.addEventListener("change", focus, false);
    male.addEventListener("change", focus, false);
    female.addEventListener("change", focus, false);
    grade.addEventListener("change", focus, false);
    this.$gapi.isSignedIn().then(result => {
      if (result) {
        this.isSignedIn = "Sign Out";
      } else {
        this.isSignedIn = "Sign In";
      }
    });
  },
  watch: {
    grade(newGrade) {
      localStorage.setItem("grade", newGrade);
    },
    gender(newGender) {
      localStorage.setItem("gender", newGender);
    },
    event(newEvent) {
      localStorage.setItem("event", newEvent);
    }
  }
};
</script>

<style scoped>
.student_image {
  width: 50px;
  height: 50px;
}

.signinButton {
  color: #000000 !important;
}

#searchBox {
  display: block;
  margin-top: 5px;
  margin-bottom: 5px;
}

#SBS_logo {
  display: block;
}

#remainingStudents {
  float: left;
}

#checkedStudents {
  margin-left: 250px;
}

#submitButton {
  display: block;
  cursor: pointer;
}

#user_image {
  border-radius: 50%;
}

.students {
  cursor: pointer;
}

select {
  display: block;
}
</style>
