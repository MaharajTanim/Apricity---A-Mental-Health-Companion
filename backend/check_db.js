const mongoose = require("mongoose");
const uri =
  "mongodb+srv://maharajtanim106_db_user:pRwCunQgH4DivB3B@apricity.drp3ggm.mongodb.net/apricity?retryWrites=true&w=majority&appName=Apricity";

mongoose
  .connect(uri)
  .then(async () => {
    const Diary = require("./src/models/Diary");
    const User = require("./src/models/User");

    const diaries = await Diary.find().lean();
    console.log("Total diaries:", diaries.length);
    for (const d of diaries) {
      console.log("Diary:", d.title, "| User ID:", d.user.toString());
    }

    console.log("");

    const users = await User.find().lean();
    console.log("Users:");
    for (const u of users) {
      console.log("User:", u.email, "| ID:", u._id.toString());
    }

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
