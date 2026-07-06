#!/usr/bin/env python3
import os
from collections import Counter
SK = "1f3fb,1f3fc,1f3fd,1f3fe,1f3ff"
emojis = []

SMILEYS = [
    ("grinning","😀"),("smiley","😃"),("smile","😄"),("grin","😁"),
    ("laughing","😆"),("sweat_smile","😅"),("rofl","🤣"),("joy","😂"),
    ("slightly_smiling","🙂"),("upside_down","🙃"),("melting_face","🫠"),
    ("wink","😉"),("blush","😊"),("innocent","😇"),
    ("heart_eyes","😍"),("star_struck","🤩"),
    ("kissing_heart","😘"),("kissing","😗"),("relaxed","☺️"),
    ("kissing_closed_eyes","😚"),("kissing_smiling_eyes","😙"),
    ("smiling_face_with_tear","🥲"),("yum","😋"),
    ("stuck_out_tongue","😛"),("stuck_out_tongue_winking_eye","😜"),
    ("zany_face","🤪"),("stuck_out_tongue_closed_eyes","😝"),
    ("money_mouth","🤑"),("hugging_face","🤗"),
    ("face_with_hand_over_mouth","🤭"),("face_with_open_eyes_and_hand_over_mouth","🫢"),
    ("face_with_peeking_eye","🫣"),("shushing_face","🤫"),
    ("thinking","🤔"),("saluting_face","🫡"),("zipper_mouth","🤐"),
    ("raised_eyebrow","🤨"),("neutral_face","😐"),("expressionless","😑"),
    ("no_mouth","😶"),("dotted_line_face","🫥"),("smirk","😏"),
    ("unamused","😒"),("roll_eyes","🙄"),("grimacing","😬"),
    ("face_exhaling","😮‍💨"),("lying_face","🤥"),("relieved","😌"),
    ("pensive","😔"),("sleepy","😪"),("drooling_face","🤤"),
    ("sleeping","😴"),("mask","😷"),("face_with_thermometer","🤒"),
    ("face_with_head_bandage","🤕"),("nauseated_face","🤢"),
    ("face_vomiting","🤮"),("sneezing_face","🤧"),("hot_face","🥵"),
    ("cold_face","🥶"),("woozy_face","🥴"),("dizzy_face","😵"),
    ("face_with_spiral_eyes","😵‍💫"),("exploding_head","🤯"),
    ("cowboy_hat_face","🤠"),("partying_face","🥳"),("disguised_face","🥸"),
    ("sunglasses","😎"),("nerd_face","🤓"),("monocle_face","🧐"),
    ("confused","😕"),("worried","😟"),("slightly_frowning","🙁"),
    ("frowning_face","☹️"),("open_mouth","😮"),("hushed","😯"),
    ("astonished","😲"),("flushed","😳"),("pleading_face","🥺"),
    ("face_holding_back_tears","🥹"),("frowning","😦"),("anguished","😧"),
    ("fearful","😨"),("cold_sweat","😰"),("disappointed_relieved","😥"),
    ("cry","😢"),("sob","😭"),("scream","😱"),("confounded","😖"),
    ("persevere","😣"),("disappointed","😞"),("sweat","😓"),
    ("weary","😩"),("tired_face","😫"),("yawning_face","🥱"),
    ("triumph","😤"),("pout","😡"),("angry","😠"),("cursing_face","🤬"),
    ("smiling_imp","😈"),("imp","👿"),("skull","💀"),
    ("skull_and_crossbones","☠️"),("poop","💩"),("clown_face","🤡"),
    ("ogre","👹"),("goblin","👺"),("ghost","👻"),("alien","👽"),
    ("alien_monster","👾"),("robot","🤖"),
    ("grinning_cat","😺"),("grinning_cat_with_smiling_eyes","😸"),
    ("cat_with_tears_of_joy","😹"),("smiling_cat_with_heart_eyes","😻"),
    ("cat_with_wry_smile","😼"),("kissing_cat","😽"),
    ("weary_cat","🙀"),("crying_cat","😿"),("pouting_cat","😾"),
    ("see_no_evil_monkey","🙈"),("hear_no_evil_monkey","🙉"),
    ("speak_no_evil_monkey","🙊"),("kiss_mark","💋"),("love_letter","💌"),
    ("cupid","💘"),("gift_heart","💝"),("sparkling_heart","💖"),
    ("heartpulse","💗"),("heartbeat","💓"),("revolving_hearts","💞"),
    ("two_hearts","💕"),("heart_decoration","💟"),
    ("heart_exclamation","❣️"),("broken_heart","💔"),
    ("heart_on_fire","❤️‍🔥"),("mending_heart","❤️‍🩹"),
    ("red_heart","❤️"),("orange_heart","🧡"),("yellow_heart","💛"),
    ("green_heart","💚"),("blue_heart","💙"),("purple_heart","💜"),
    ("brown_heart","🤎"),("black_heart","🖤"),("white_heart","🤍"),
    ("hundred_points","💯"),("anger_symbol","💢"),("collision","💥"),
    ("dizzy","💫"),("sweat_droplets","💦"),("dashing_away","💨"),
    ("hole","🕳️"),("speech_balloon","💬"),
    ("eye_in_speech_bubble","👁️‍🗨️"),("left_speech_bubble","🗨️"),
    ("right_anger_bubble","🗯️"),("thought_balloon","💭"),("zzz","💤"),
]

PEOPLE_WITH_SK = [
    ("wave","👋"),("raised_back_of_hand","🤚"),("raised_hand_with_fingers_splayed","🖐️"),
    ("hand","✋"),("vulcan_salute","🖖"),("rightwards_hand","🫱"),
    ("leftwards_hand","🫲"),("palm_down_hand","🫳"),("palm_up_hand","🫴"),
    ("leftwards_pushing_hand","🫷"),("rightwards_pushing_hand","🫸"),
    ("ok_hand","👌"),("pinched_fingers","🤌"),("pinching_hand","🤏"),
    ("victory_hand","✌️"),("crossed_fingers","🤞"),
    ("hand_with_index_finger_and_thumb_crossed","🫰"),
    ("love_you_gesture","🤟"),("sign_of_the_horns","🤘"),("call_me_hand","🤙"),
    ("backhand_index_pointing_left","👈"),("backhand_index_pointing_right","👉"),
    ("backhand_index_pointing_up","👆"),("middle_finger","🖕"),
    ("backhand_index_pointing_down","👇"),("index_pointing_up","☝️"),
    ("index_pointing_at_the_viewer","🫵"),("thumbs_up","👍"),("thumbs_down","👎"),
    ("raised_fist","✊"),("oncoming_fist","👊"),("left_facing_fist","🤛"),
    ("right_facing_fist","🤜"),("clapping_hands","👏"),("raising_hands","🙌"),
    ("heart_hands","🫶"),("open_hands","👐"),("palms_up_together","🤲"),
    ("folded_hands","🙏"),("writing_hand","✍️"),("nail_polish","💅"),
    ("selfie","🤳"),("flexed_biceps","💪"),("leg","🦵"),("foot","🦶"),
    ("ear","👂"),("ear_with_hearing_aid","🦻"),("nose","👃"),
    ("baby","👶"),("child","🧒"),("boy","👦"),("girl","👧"),
    ("person","🧑"),("person_blond_hair","👱"),("man","👨"),("woman","👩"),
    ("older_person","🧓"),("old_man","👴"),("old_woman","👵"),
    ("person_red_hair","🧑‍🦰"),("person_curly_hair","🧑‍🦱"),("person_white_hair","🧑‍🦳"),("person_bald","🧑‍🦲"),
    ("man_red_hair","👨‍🦰"),("man_curly_hair","👨‍🦱"),("man_white_hair","👨‍🦳"),("man_bald","👨‍🦲"),
    ("woman_red_hair","👩‍🦰"),("woman_curly_hair","👩‍🦱"),("woman_white_hair","👩‍🦳"),("woman_bald","👩‍🦲"),
    ("bearded_person","🧔"),("person_beard","🧔‍♂️"),("woman_beard","🧔‍♀️"),
    ("health_worker","🧑‍⚕️"),("man_health_worker","👨‍⚕️"),("woman_health_worker","👩‍⚕️"),
    ("student","🧑‍🎓"),("man_student","👨‍🎓"),("woman_student","👩‍🎓"),
    ("teacher","🧑‍🏫"),("man_teacher","👨‍🏫"),("woman_teacher","👩‍🏫"),
    ("judge","🧑‍⚖️"),("man_judge","👨‍⚖️"),("woman_judge","👩‍⚖️"),
    ("farmer","🧑‍🌾"),("man_farmer","👨‍🌾"),("woman_farmer","👩‍🌾"),
    ("cook","🧑‍🍳"),("man_cook","👨‍🍳"),("woman_cook","👩‍🍳"),
    ("mechanic","🧑‍🔧"),("man_mechanic","👨‍🔧"),("woman_mechanic","👩‍🔧"),
    ("factory_worker","🧑‍🏭"),("man_factory_worker","👨‍🏭"),("woman_factory_worker","👩‍🏭"),
    ("office_worker","🧑‍💼"),("man_office_worker","👨‍💼"),("woman_office_worker","👩‍💼"),
    ("scientist","🧑‍🔬"),("man_scientist","👨‍🔬"),("woman_scientist","👩‍🔬"),
    ("technologist","🧑‍💻"),("man_technologist","👨‍💻"),("woman_technologist","👩‍💻"),
    ("singer","🧑‍🎤"),("man_singer","👨‍🎤"),("woman_singer","👩‍🎤"),
    ("artist","🧑‍🎨"),("man_artist","👨‍🎨"),("woman_artist","👩‍🎨"),
    ("pilot","🧑‍✈️"),("man_pilot","👨‍✈️"),("woman_pilot","👩‍✈️"),
    ("astronaut","🧑‍🚀"),("man_astronaut","👨‍🚀"),("woman_astronaut","👩‍🚀"),
    ("firefighter","🧑‍🚒"),("man_firefighter","👨‍🚒"),("woman_firefighter","👩‍🚒"),
    ("police_officer","👮"),("man_police_officer","👮‍♂️"),("woman_police_officer","👮‍♀️"),
    ("detective","🕵️"),("man_detective","🕵️‍♂️"),("woman_detective","🕵️‍♀️"),
    ("guard","💂"),("man_guard","💂‍♂️"),("woman_guard","💂‍♀️"),
    ("ninja","🥷"),("construction_worker","👷"),
    ("man_construction_worker","👷‍♂️"),("woman_construction_worker","👷‍♀️"),
    ("prince","🤴"),("princess","👸"),
    ("person_wearing_turban","👳"),("man_wearing_turban","👳‍♂️"),("woman_wearing_turban","👳‍♀️"),
    ("person_with_skullcap","🧕"),
    ("person_in_tuxedo","🤵"),("man_in_tuxedo","🤵‍♂️"),("woman_in_tuxedo","🤵‍♀️"),
    ("person_with_veil","👰"),("man_with_veil","👰‍♂️"),("woman_with_veil","👰‍♀️"),
    ("pregnant_woman","🤰"),("pregnant_man","🫃"),("pregnant_person","🫄"),
    ("breast_feeding","🤱"),("woman_feeding_baby","👩‍🍼"),("man_feeding_baby","👨‍🍼"),("person_feeding_baby","🧑‍🍼"),
    ("angel","👼"),("santa_claus","🎅"),("mrs_claus","🤶"),("mx_claus","🧑‍🎄"),
    ("superhero","🦸"),("man_superhero","🦸‍♂️"),("woman_superhero","🦸‍♀️"),
    ("supervillain","🦹"),("man_supervillain","🦹‍♂️"),("woman_supervillain","🦹‍♀️"),
    ("mage","🧙"),("man_mage","🧙‍♂️"),("woman_mage","🧙‍♀️"),
    ("fairy","🧚"),("man_fairy","🧚‍♂️"),("woman_fairy","🧚‍♀️"),
    ("vampire","🧛"),("man_vampire","🧛‍♂️"),("woman_vampire","🧛‍♀️"),
    ("merperson","🧜"),("merman","🧜‍♂️"),("mermaid","🧜‍♀️"),
    ("elf","🧝"),("man_elf","🧝‍♂️"),("woman_elf","🧝‍♀️"),
    ("person_getting_massage","💆"),("man_getting_massage","💆‍♂️"),("woman_getting_massage","💆‍♀️"),
    ("person_getting_haircut","💇"),("man_getting_haircut","💇‍♂️"),("woman_getting_haircut","💇‍♀️"),
    ("person_walking","🚶"),("man_walking","🚶‍♂️"),("woman_walking","🚶‍♀️"),
    ("person_standing","🧍"),("man_standing","🧍‍♂️"),("woman_standing","🧍‍♀️"),
    ("person_kneeling","🧎"),("man_kneeling","🧎‍♂️"),("woman_kneeling","🧎‍♀️"),
    ("person_with_white_cane","🧑‍🦯"),("man_with_white_cane","👨‍🦯"),("woman_with_white_cane","👩‍🦯"),
    ("person_in_motorized_wheelchair","🧑‍🦼"),("man_in_motorized_wheelchair","👨‍🦼"),("woman_in_motorized_wheelchair","👩‍🦼"),
    ("person_in_manual_wheelchair","🧑‍🦽"),("man_in_manual_wheelchair","👨‍🦽"),("woman_in_manual_wheelchair","👩‍🦽"),
    ("person_running","🏃"),("man_running","🏃‍♂️"),("woman_running","🏃‍♀️"),
    ("woman_dancing","💃"),("man_dancing","🕺"),("person_in_suit_levitating","🕴️"),
    ("person_in_steamy_room","🧖"),("man_in_steamy_room","🧖‍♂️"),("woman_in_steamy_room","🧖‍♀️"),
    ("person_climbing","🧗"),("man_climbing","🧗‍♂️"),("woman_climbing","🧗‍♀️"),
    ("horse_racing","🏇"),("snowboarder","🏂"),
    ("person_golfing","🏌️"),("man_golfing","🏌️‍♂️"),("woman_golfing","🏌️‍♀️"),
    ("person_surfing","🏄"),("man_surfing","🏄‍♂️"),("woman_surfing","🏄‍♀️"),
    ("person_rowing_boat","🚣"),("man_rowing_boat","🚣‍♂️"),("woman_rowing_boat","🚣‍♀️"),
    ("person_swimming","🏊"),("man_swimming","🏊‍♂️"),("woman_swimming","🏊‍♀️"),
    ("person_bouncing_ball","⛹️"),("man_bouncing_ball","⛹️‍♂️"),("woman_bouncing_ball","⛹️‍♀️"),
    ("person_lifting_weights","🏋️"),("man_lifting_weights","🏋️‍♂️"),("woman_lifting_weights","🏋️‍♀️"),
    ("person_bicycling","🚴"),("man_bicycling","🚴‍♂️"),("woman_bicycling","🚴‍♀️"),
    ("person_mountain_biking","🚵"),("man_mountain_biking","🚵‍♂️"),("woman_mountain_biking","🚵‍♀️"),
    ("person_cartwheeling","🤸"),("man_cartwheeling","🤸‍♂️"),("woman_cartwheeling","🤸‍♀️"),
    ("person_playing_water_polo","🤽"),("man_playing_water_polo","🤽‍♂️"),("woman_playing_water_polo","🤽‍♀️"),
    ("person_playing_handball","🤾"),("man_playing_handball","🤾‍♂️"),("woman_playing_handball","🤾‍♀️"),
    ("person_juggling","🤹"),("man_juggling","🤹‍♂️"),("woman_juggling","🤹‍♀️"),
    ("person_in_lotus_position","🧘"),("man_in_lotus_position","🧘‍♂️"),("woman_in_lotus_position","🧘‍♀️"),
    ("person_taking_bath","🛀"),("person_in_bed","🛌"),
]

PEOPLE_NO_SK = [
    ("handshake","🤝"),("mechanical_arm","🦾"),("mechanical_leg","🦿"),
    ("brain","🧠"),("anatomical_heart","🫀"),("lungs","🫁"),
    ("tooth","🦷"),("bone","🦴"),("eyes","👀"),("eye","👁️"),
    ("tongue","👅"),("mouth","👄"),("biting_lip","🫦"),
    ("genie","🧞"),("man_genie","🧞‍♂️"),("woman_genie","🧞‍♀️"),
    ("zombie","🧟"),("man_zombie","🧟‍♂️"),("woman_zombie","🧟‍♀️"),
    ("people_with_bunny_ears","👯"),("men_with_bunny_ears","👯‍♂️"),("women_with_bunny_ears","👯‍♀️"),
    ("person_fencing","🤺"),("skier","⛷️"),
    ("people_wrestling","🤼"),("men_wrestling","🤼‍♂️"),("women_wrestling","🤼‍♀️"),
    ("people_holding_hands","🧑‍🤝‍🧑"),("women_holding_hands","👩‍🤝‍👩"),
    ("woman_and_man_holding_hands","👩‍🤝‍👨"),("men_holding_hands","👨‍🤝‍👨"),
    ("kiss","💏"),("kiss_woman_man","👩‍❤️‍💋‍👨"),("kiss_man_man","👨‍❤️‍💋‍👨"),("kiss_woman_woman","👩‍❤️‍💋‍👩"),
    ("couple_with_heart","💑"),("couple_with_heart_woman_man","👩‍❤️‍👨"),
    ("couple_with_heart_man_man","👨‍❤️‍👨"),("couple_with_heart_woman_woman","👩‍❤️‍👩"),
    ("family","👪"),("family_man_woman_boy","👨‍👩‍👦"),("family_man_woman_girl","👨‍👩‍👧"),
    ("family_man_woman_girl_boy","👨‍👩‍👧‍👦"),("family_man_woman_boy_boy","👨‍👩‍👦‍👦"),("family_man_woman_girl_girl","👨‍👩‍👧‍👧"),
    ("family_man_man_boy","👨‍👨‍👦"),("family_man_man_girl","👨‍👨‍👧"),("family_man_man_girl_boy","👨‍👨‍👧‍👦"),
    ("family_man_man_boy_boy","👨‍👨‍👦‍👦"),("family_man_man_girl_girl","👨‍👨‍👧‍👧"),
    ("family_woman_woman_boy","👩‍👩‍👦"),("family_woman_woman_girl","👩‍👩‍👧"),("family_woman_woman_girl_boy","👩‍👩‍👧‍👦"),
    ("family_woman_woman_boy_boy","👩‍👩‍👦‍👦"),("family_woman_woman_girl_girl","👩‍👩‍👧‍👧"),
    ("family_man_boy","👨‍👦"),("family_man_boy_boy","👨‍👦‍👦"),
    ("family_man_girl","👨‍👧"),("family_man_girl_boy","👨‍👧‍👦"),("family_man_girl_girl","👨‍👧‍👧"),
    ("family_woman_boy","👩‍👦"),("family_woman_boy_boy","👩‍👦‍👦"),
    ("family_woman_girl","👩‍👧"),("family_woman_girl_boy","👩‍👧‍👦"),("family_woman_girl_girl","👩‍👧‍👧"),
    ("speaking_head","🗣️"),("bust_in_silhouette","👤"),("busts_in_silhouette","👥"),("people_hugging","🫂"),
]

ANIMALS = [
    ("monkey","🐒"),("monkey_face","🐵"),("gorilla","🦍"),("orangutan","🦧"),
    ("dog","🐶"),("dog2","🐕"),("guide_dog","🦮"),("service_dog","🐕‍🦺"),("poodle","🐩"),
    ("wolf","🐺"),("fox","🦊"),("raccoon","🦝"),
    ("cat","🐱"),("cat2","🐈"),("black_cat","🐈‍⬛"),
    ("lion","🦁"),("tiger","🐯"),("tiger2","🐅"),("leopard","🐆"),
    ("horse","🐴"),("racehorse","🐎"),("unicorn","🦄"),("zebra","🦓"),("deer","🦌"),("bison","🦬"),
    ("cow","🐮"),("ox","🐂"),("water_buffalo","🐃"),("cow2","🐄"),
    ("pig","🐷"),("pig2","🐖"),("boar","🐗"),("pig_nose","🐽"),
    ("ram","🐏"),("sheep","🐑"),("goat","🐐"),
    ("dromedary_camel","🐪"),("camel","🐫"),("llama","🦙"),("giraffe","🦒"),
    ("elephant","🐘"),("mammoth","🦣"),("rhinoceros","🦏"),("hippopotamus","🦛"),
    ("mouse","🐭"),("mouse2","🐁"),("rat","🐀"),("hamster","🐹"),
    ("rabbit","🐰"),("rabbit2","🐇"),("chipmunk","🐿️"),("beaver","🦫"),
    ("hedgehog","🦔"),("bat","🦇"),("bear","🐻"),("polar_bear","🐻‍❄️"),
    ("koala","🐨"),("panda","🐼"),
    ("sloth","🦥"),("otter","🦦"),("skunk","🦨"),("kangaroo","🦘"),("badger","🦡"),("paw_prints","🐾"),
    ("turkey","🦃"),("chicken","🐔"),("rooster","🐓"),
    ("hatching_chick","🐣"),("baby_chick","🐤"),("hatched_chick","🐥"),
    ("bird","🐦"),("penguin","🐧"),("dove","🕊️"),("eagle","🦅"),("duck","🦆"),
    ("swan","🦢"),("owl","🦉"),("dodo","🦤"),("feather","🪶"),
    ("flamingo","🦩"),("peacock","🦚"),("parrot","🦜"),
    ("frog","🐸"),("crocodile","🐊"),("turtle","🐢"),("lizard","🦎"),("snake","🐍"),
    ("dragon_face","🐲"),("dragon","🐉"),("sauropod","🦕"),("t_rex","🦖"),
    ("spouting_whale","🐳"),("whale2","🐋"),("dolphin","🐬"),("seal","🦭"),
    ("fish","🐟"),("tropical_fish","🐠"),("blowfish","🐡"),("shark","🦈"),
    ("octopus","🐙"),("shell","🐚"),("coral","🪸"),("jellyfish","🪼"),
    ("snail","🐌"),("butterfly","🦋"),("bug","🐛"),("ant","🐜"),("honeybee","🐝"),
    ("beetle","🪲"),("ladybug","🐞"),("cricket","🦗"),("cockroach","🪳"),
    ("spider","🕷️"),("spider_web","🕸️"),("scorpion","🦂"),("mosquito","🦟"),
    ("fly","🪰"),("worm","🪱"),("microbe","🦠"),
    ("bouquet","💐"),("cherry_blossom","🌸"),("white_flower","💮"),("rosette","🏵️"),
    ("rose","🌹"),("wilted_flower","🥀"),("hibiscus","🌺"),("sunflower","🌻"),
    ("blossom","🌼"),("tulip","🌷"),("hyacinth","🪻"),
    ("seedling","🌱"),("potted_plant","🪴"),
    ("evergreen_tree","🌲"),("deciduous_tree","🌳"),("palm_tree","🌴"),("cactus","🌵"),
    ("sheaf_of_rice","🌾"),("herb","🌿"),("shamrock","☘️"),
    ("four_leaf_clover","🍀"),("maple_leaf","🍁"),("fallen_leaf","🍂"),("leaf_fluttering_in_wind","🍃"),
    ("empty_nest","🪹"),("nest_with_eggs","🪺"),("mushroom","🍄"),("mushroom_brown","🍄‍🟫"),
]

FOOD = [
    ("grapes","🍇"),("melon","🍈"),("watermelon","🍉"),
    ("tangerine","🍊"),("lemon","🍋"),("lime","🍋‍🟩"),("banana","🍌"),
    ("pineapple","🍍"),("mango","🥭"),
    ("apple","🍎"),("green_apple","🍏"),("pear","🍐"),("peach","🍑"),
    ("cherries","🍒"),("strawberry","🍓"),("blueberries","🫐"),
    ("kiwi_fruit","🥝"),("tomato","🍅"),("olive","🫒"),("coconut","🥥"),
    ("avocado","🥑"),("eggplant","🍆"),("potato","🥔"),("carrot","🥕"),
    ("corn","🌽"),("hot_pepper","🌶️"),("bell_pepper","🫑"),("cucumber","🥒"),
    ("leafy_green","🥬"),("broccoli","🥦"),("garlic","🧄"),("onion","🧅"),
    ("peanuts","🥜"),("beans","🫘"),("chestnut","🌰"),("ginger_root","🫚"),("pea_pod","🫛"),
    ("bread","🍞"),("croissant","🥐"),("baguette_bread","🥖"),("flatbread","🫓"),
    ("pretzel","🥨"),("bagel","🥯"),("pancakes","🥞"),("waffle","🧇"),("cheese_wedge","🧀"),
    ("meat_on_bone","🍖"),("poultry_leg","🍗"),("cut_of_meat","🥩"),("bacon","🥓"),
    ("hamburger","🍔"),("french_fries","🍟"),("pizza","🍕"),
    ("hot_dog","🌭"),("sandwich","🥪"),("taco","🌮"),("burrito","🌯"),("tamale","🫔"),
    ("stuffed_flatbread","🥙"),("falafel","🧆"),
    ("egg","🥚"),("cooking","🍳"),("butter","🧈"),
    ("shallow_pan_of_food","🥘"),("pot_of_food","🍲"),("fondue","🫕"),
    ("bowl_with_spoon","🥣"),("green_salad","🥗"),("popcorn","🍿"),("salt","🧂"),("canned_food","🥫"),
    ("bento","🍱"),("rice_cracker","🍘"),("rice_ball","🍙"),("rice","🍚"),
    ("curry_rice","🍛"),("ramen","🍜"),("spaghetti","🍝"),("sweet_potato","🍠"),
    ("oden","🍢"),("sushi","🍣"),("fried_shrimp","🍤"),("fish_cake","🍥"),
    ("moon_cake","🥮"),("dango","🍡"),("dumpling","🥟"),("fortune_cookie","🥠"),("takeout_box","🥡"),
    ("soft_ice_cream","🍦"),("shaved_ice","🍧"),("ice_cream","🍨"),
    ("doughnut","🍩"),("cookie","🍪"),("birthday_cake","🎂"),("shortcake","🍰"),
    ("cupcake","🧁"),("pie","🥧"),
    ("chocolate_bar","🍫"),("candy","🍬"),("lollipop","🍭"),("custard","🍮"),("honey_pot","🍯"),
    ("baby_bottle","🍼"),("glass_of_milk","🥛"),("coffee","☕"),
    ("teacup_without_handle","🍵"),("mate","🧉"),("bubble_tea","🧋"),("beverage_box","🧃"),
    ("sake","🍶"),("bottle_with_popping_cork","🍾"),
    ("wine_glass","🍷"),("cocktail_glass","🍸"),("tropical_drink","🍹"),
    ("beer_mug","🍺"),("clinking_beer_mugs","🍻"),
    ("clinking_glasses","🥂"),("tumbler_glass","🥃"),("pour_liquid","🫗"),("cup_with_straw","🥤"),
    ("chopsticks","🥢"),("fork_and_knife","🍴"),("spoon","🥄"),("kitchen_knife","🔪"),("jar","🫙"),("amphora","🏺"),
]

TRAVEL = [
    ("car","🚗"),("taxi","🚕"),("blue_car","🚙"),("bus","🚌"),("trolleybus","🚎"),
    ("racing_car","🏎️"),("police_car","🚓"),("ambulance","🚑"),("fire_engine","🚒"),
    ("minibus","🚐"),("pickup_truck","🛻"),("delivery_truck","🚚"),
    ("articulated_lorry","🚛"),("tractor","🚜"),
    ("scooter","🛴"),("manual_wheelchair","🦽"),("motorized_wheelchair","🦼"),
    ("bicycle","🚲"),("motor_scooter","🛵"),("motorcycle","🏍️"),("auto_rickshaw","🛺"),
    ("police_car_light","🚔"),("oncoming_bus","🚍"),("oncoming_taxi","🚖"),("oncoming_automobile","🚘"),
    ("railway_car","🚃"),("train","🚆"),("monorail","🚝"),("mountain_railway","🚞"),
    ("tram","🚊"),("metro","🚇"),("light_rail","🚈"),("station","🚉"),("tram_car","🚋"),
    ("bullettrain_side","🚄"),("bullettrain_front","🚅"),("steam_locomotive","🚂"),
    ("airplane","✈️"),("small_airplane","🛩️"),("airplane_departure","🛫"),("airplane_arrival","🛬"),
    ("parachute","🪂"),("seat","💺"),
    ("helicopter","🚁"),("suspension_railway","🚟"),("mountain_cableway","🚠"),("aerial_tramway","🚡"),
    ("satellite","🛰️"),("rocket","🚀"),("flying_saucer","🛸"),
    ("anchor","⚓"),("sailboat","⛵"),("motor_boat","🛥️"),("speedboat","🚤"),
    ("ferry","⛴️"),("passenger_ship","🛳️"),("ship","🚢"),("canoe","🛶"),
    ("fuel_pump","⛽"),("construction","🚧"),("vertical_traffic_light","🚦"),("traffic_light","🚥"),("bus_stop","🚏"),
    ("world_map","🗺️"),("moai","🗿"),("shinto_shrine","⛩️"),("kaaba","🕋"),
    ("fountain","⛲"),("tent","⛺"),("foggy","🌁"),("night_with_stars","🌃"),
    ("cityscape","🏙️"),("sunrise_over_mountains","🌄"),("sunrise","🌅"),
    ("city_sunset","🌆"),("city_sunrise","🌇"),("bridge_at_night","🌉"),
    ("hot_springs","♨️"),("carousel_horse","🎠"),("playground_slide","🛝"),
    ("ferris_wheel","🎡"),("roller_coaster","🎢"),("barber_pole","💈"),("circus_tent","🎪"),
    ("house","🏠"),("house_with_garden","🏡"),("office","🏢"),
    ("post_office","🏣"),("european_post_office","🏤"),("hospital","🏥"),("bank","🏦"),
    ("hotel","🏨"),("love_hotel","🏩"),("convenience_store","🏪"),("school","🏫"),
    ("department_store","🏬"),("factory","🏭"),
    ("japanese_castle","🏯"),("european_castle","🏰"),("stadium","🏟️"),
    ("statue_of_liberty","🗽"),("eiffel_tower","🗼"),
    ("church","⛪"),("mosque","🕌"),("hindu_temple","🛕"),("synagogue","🕍"),
    ("mountain","⛰️"),("volcano","🌋"),("mount_fuji","🗻"),
    ("camping","🏕️"),("beach_with_umbrella","🏖️"),("desert","🏜️"),("desert_island","🏝️"),("national_park","🏞️"),
    ("snow_capped_mountain","🏔️"),
    ("star","⭐"),("glowing_star","🌟"),("shooting_star","🌠"),("milky_way","🌌"),
    ("cloud","☁️"),("sun_behind_cloud","⛅"),("cloud_with_lightning_and_rain","⛈️"),
    ("sun_behind_small_cloud","🌤️"),("sun_behind_large_cloud","🌥️"),("sun_behind_rain_cloud","🌦️"),
    ("cloud_with_rain","🌧️"),("cloud_with_snow","🌨️"),("cloud_with_lightning","🌩️"),
    ("tornado","🌪️"),("fog","🌫️"),("wind_face","🌬️"),
    ("cyclone","🌀"),("rainbow","🌈"),
    ("closed_umbrella","🌂"),("umbrella","☂️"),("umbrella_with_rain_drops","☔"),("umbrella_on_ground","⛱️"),
    ("snowflake","❄️"),("snowman","⛄"),("snowman_with_snow","☃️"),("comet","☄️"),
    ("fire","🔥"),("droplet","💧"),("ocean","🌊"),
    ("new_moon","🌑"),("waxing_crescent_moon","🌒"),("first_quarter_moon","🌓"),
    ("waxing_gibbous_moon","🌔"),("full_moon","🌕"),("waning_gibbous_moon","🌖"),
    ("last_quarter_moon","🌗"),("waning_crescent_moon","🌘"),
    ("crescent_moon","🌙"),("new_moon_face","🌚"),
    ("first_quarter_moon_face","🌛"),("last_quarter_moon_face","🌜"),
    ("sun_with_face","🌞"),("sun","☀️"),
    ("watch","⌚"),("alarm_clock","⏰"),("stopwatch","⏱️"),("timer_clock","⏲️"),
    ("mantelpiece_clock","🕰️"),("hourglass","⌛"),("hourglass_flowing_sand","⏳"),
    ("satellite_antenna","📡"),
]

ACTIVITIES = [
    ("soccer","⚽"),("basketball","🏀"),("football","🏈"),("baseball","⚾"),("softball","🥎"),
    ("tennis","🎾"),("volleyball","🏐"),("rugby_football","🏉"),("flying_disc","🥏"),
    ("pool_8","🎱"),("yo_yo","🪀"),("ping_pong","🏓"),("badminton","🏸"),
    ("ice_hockey","🏒"),("field_hockey","🏑"),("lacrosse","🥍"),("cricket_game","🏏"),
    ("boomerang","🪃"),("goal_net","🥅"),("golf","⛳"),("ice_skate","⛸️"),
    ("fishing_pole","🎣"),("diving_mask","🤿"),
    ("boxing_glove","🥊"),("martial_arts_uniform","🥋"),("running_shirt","🎽"),
    ("skateboard","🛹"),("roller_skate","🛼"),("sled","🛷"),("curling_stone","🥌"),
    ("dart","🎯"),("bowling","🎳"),
    ("video_game","🎮"),("game_die","🎲"),("chess_pawn","♟️"),("slot_machine","🎰"),("jigsaw","🧩"),
    ("performing_arts","🎭"),("artist_palette","🎨"),("clapper_board","🎬"),
    ("microphone","🎤"),("headphone","🎧"),("musical_score","🎼"),
    ("musical_keyboard","🎹"),("drum","🥁"),("long_drum","🪘"),
    ("saxophone","🎷"),("trumpet","🎺"),("guitar","🎸"),("banjo","🪕"),("violin","🎻"),("accordion","🪗"),
    ("party_popper","🎉"),("balloon","🎈"),("confetti_ball","🎊"),
    ("sparkler","🎇"),("fireworks","🎆"),
    ("ribbon","🎀"),("gift","🎁"),
    ("jack_o_lantern","🎃"),("christmas_tree","🎄"),
    ("tanabata_tree","🎋"),("pine_decoration","🎍"),
    ("japanese_dolls","🎎"),("carp_streamer","🎏"),("wind_chime","🎐"),("moon_viewing","🎑"),
    ("red_envelope","🧧"),("firecracker","🧨"),("sparkles","✨"),("globe_with_meridians","🌐"),
    ("medal_military","🎖️"),("medal_sports","🏅"),("trophy","🏆"),
    ("first_place","🥇"),("second_place","🥈"),("third_place","🥉"),
    ("ticket","🎫"),("admission_tickets","🎟️"),("military_helmet","🪖"),
]

OBJECTS = [
    ("glasses","👓"),("sunglasses","🕶️"),("goggles","🥽"),("lab_coat","🥼"),("safety_vest","🦺"),
    ("necktie","👔"),("t_shirt","👕"),("jeans","👖"),
    ("scarf","🧣"),("gloves","🧤"),("coat","🧥"),("socks","🧦"),
    ("dress","👗"),("kimono","👘"),("sari","🥻"),("one_piece_swimsuit","🩱"),("briefs","🩲"),("shorts","🩳"),("bikini","👙"),("womans_clothes","👚"),
    ("purse","👛"),("handbag","👜"),("clutch_bag","👝"),("shopping_bags","🛍️"),("backpack","🎒"),
    ("shoe","👞"),("running_shoe","👟"),("hiking_boot","🥾"),("flat_shoe","🥿"),
    ("high_heel","👠"),("sandal","👡"),("boot","👢"),
    ("crown","👑"),("womans_hat","👒"),("top_hat","🎩"),("graduation_cap","🎓"),("billed_cap","🧢"),
    ("rescue_worker_helmet","⛑️"),("prayer_beads","📿"),
    ("lipstick","💄"),("ring","💍"),("gem_stone","💎"),
    ("mute","🔇"),("speaker","🔈"),("sound","🔉"),("loud_sound","🔊"),
    ("loudspeaker","📢"),("megaphone","📣"),("postal_horn","📯"),("bell","🔔"),("no_bell","🔕"),
    ("musical_note","🎵"),("musical_notes","🎶"),("studio_microphone","🎙️"),("level_slider","🎚️"),("control_knobs","🎛️"),
    ("laptop","💻"),("keyboard","⌨️"),("desktop_computer","🖥️"),("printer","🖨️"),
    ("computer_mouse","🖱️"),("trackball","🖲️"),("computer_disk","💽"),("floppy_disk","💾"),("optical_disk","💿"),("dvd","📀"),("abacus","🧮"),
    ("mobile_phone","📱"),("mobile_phone_arrow","📲"),("telephone","☎️"),("telephone_receiver","📞"),("pager","📟"),("fax_machine","📠"),
    ("battery","🔋"),("low_battery","🪫"),("electric_plug","🔌"),
    ("light_bulb","💡"),("flashlight","🔦"),("candle","🕯️"),("diya_lamp","🪔"),("fire_extinguisher","🧯"),
    ("money_with_wings","💸"),("dollar_banknote","💵"),("yen_banknote","💴"),("euro_banknote","💶"),("pound_banknote","💷"),
    ("money_bag","💰"),("credit_card","💳"),("receipt","🧾"),
    ("chart_increasing","📈"),("chart_decreasing","📉"),
    ("currency_exchange","💱"),("heavy_dollar_sign","💲"),
    ("envelope","✉️"),("e_mail","📧"),("incoming_envelope","📨"),("envelope_with_arrow","📩"),
    ("outbox_tray","📤"),("inbox_tray","📥"),("package","📦"),
    ("closed_mailbox_with_raised_flag","📫"),("closed_mailbox_with_lowered_flag","📪"),
    ("open_mailbox_with_raised_flag","📬"),("open_mailbox_with_lowered_flag","📭"),("postbox","📮"),
    ("ballot_box_with_ballot","🗳️"),
    ("pencil","✏️"),("black_nib","✒️"),("fountain_pen","🖋️"),("pen","🖊️"),("paintbrush","🖌️"),("crayon","🖍️"),("memo","📝"),
    ("briefcase","💼"),("file_folder","📁"),("open_file_folder","📂"),("card_index_dividers","🗂️"),
    ("date","📅"),("calendar","📆"),("spiral_notepad","🗒️"),("spiral_calendar","🗓️"),("card_index","📇"),
    ("clipboard","📋"),("pushpin","📌"),("round_pushpin","📍"),("paperclip","📎"),
    ("linked_paperclips","🖇️"),("straight_ruler","📏"),("triangular_ruler","📐"),
    ("scissors","✂️"),("card_file_box","🗃️"),("file_cabinet","🗄️"),("wastebasket","🗑️"),
    ("lock","🔒"),("unlock","🔓"),("locked_with_pen","🔏"),("locked_with_key","🔐"),
    ("key","🔑"),("old_key","🗝️"),
    ("hammer","🔨"),("axe","🪓"),("pick","⛏️"),("hammer_and_pick","⚒️"),("hammer_and_wrench","🛠️"),
    ("dagger","🗡️"),("crossed_swords","⚔️"),("water_pistol","🔫"),
    ("bow_and_arrow","🏹"),("shield","🛡️"),("carpentry_saw","🪚"),
    ("wrench","🔧"),("screwdriver","🪛"),("nut_and_bolt","🔩"),("gear","⚙️"),
    ("clamp","🗜️"),("balance_scale","⚖️"),("white_cane","🦯"),
    ("link","🔗"),("chains","⛓️"),("hook","🪝"),
    ("toolbox","🧰"),("magnet","🧲"),("ladder","🪜"),
    ("alembic","⚗️"),("test_tube","🧪"),("petri_dish","🧫"),("dna","🧬"),("microscope","🔬"),("telescope","🔭"),
    ("syringe","💉"),("drop_of_blood","🩸"),("pill","💊"),("adhesive_bandage","🩹"),("crutch","🩼"),("stethoscope","🩺"),("x_ray","🩻"),
    ("door","🚪"),("elevator","🛗"),("mirror","🪞"),("window","🪟"),
    ("bed","🛏️"),("couch_and_lamp","🛋️"),("chair","🪑"),
    ("toilet","🚽"),("plunger","🪠"),("shower","🚿"),("bathtub","🛁"),
    ("mouse_trap","🪤"),("razor","🪒"),("lotion_bottle","🧴"),("safety_pin","🧷"),
    ("broom","🧹"),("basket","🧺"),("roll_of_paper","🧻"),("bucket","🪣"),
    ("soap","🧼"),("toothbrush","🪥"),("sponge","🧽"),
    ("thread","🧵"),("yarn","🧶"),("knot","🪢"),
    ("bomb","💣"),("smoking","🚬"),("coffin","⚰️"),("headstone","🪦"),("funeral_urn","⚱️"),
    ("nazar_amulet","🧿"),("hamsa","🪬"),("rock","🪨"),("wood","🪵"),
    ("camera","📷"),("camera_flash","📸"),("video_camera","📹"),("movie_camera","🎥"),
    ("film_projector","📽️"),("film_frames","🎞️"),("television","📺"),("radio","📻"),("vhs","📼"),
    ("newspaper","📰"),("book","📖"),("green_book","📗"),("blue_book","📘"),("orange_book","📙"),
    ("books","📚"),("notebook","📓"),("ledger","📒"),("page_with_curl","📃"),("scroll","📜"),
    ("page_facing_up","📄"),("bookmark_tabs","📑"),("bookmark","🔖"),("label","🏷️"),
    ("coin","🪙"),("ice_cube","🧊"),
]

SYMBOLS = [
    ("aries","♈"),("taurus","♉"),("gemini","♊"),("cancer","♋"),("leo","♌"),("virgo","♍"),
    ("libra","♎"),("scorpius","♏"),("sagittarius","♐"),("capricorn","♑"),("aquarius","♒"),("pisces","♓"),("ophiuchus","⛎"),
    ("peace_symbol","☮️"),("latin_cross","✝️"),("star_and_crescent","☪️"),("om","🕉️"),
    ("wheel_of_dharma","☸️"),("star_of_david","✡️"),("six_pointed_star","🔯"),
    ("menorah","🕎"),("yin_yang","☯️"),("orthodox_cross","☦️"),("place_of_worship","🛐"),
    ("red_circle","🔴"),("orange_circle","🟠"),("yellow_circle","🟡"),("green_circle","🟢"),
    ("blue_circle","🔵"),("purple_circle","🟣"),("brown_circle","🟤"),("black_circle","⚫"),("white_circle","⚪"),
    ("red_square","🟥"),("orange_square","🟧"),("yellow_square","🟨"),("green_square","🟩"),
    ("blue_square","🟦"),("purple_square","🟪"),("brown_square","🟫"),
    ("black_large_square","⬛"),("white_large_square","⬜"),
    ("black_medium_square","◼️"),("white_medium_square","◻️"),
    ("black_medium_small_square","◾"),("white_medium_small_square","◽"),
    ("black_small_square","▪️"),("white_small_square","▫️"),
    ("large_orange_diamond","🔶"),("large_blue_diamond","🔷"),("small_orange_diamond","🔸"),("small_blue_diamond","🔹"),
    ("red_triangle_pointed_up","🔺"),("red_triangle_pointed_down","🔻"),("diamond_with_a_dot","💠"),("radio_button","🔘"),
    ("white_square_button","🔳"),("black_square_button","🔲"),
    ("up_arrow","⬆️"),("up_right_arrow","↗️"),("right_arrow","➡️"),("down_right_arrow","↘️"),
    ("down_arrow","⬇️"),("down_left_arrow","↙️"),("left_arrow","⬅️"),("up_left_arrow","↖️"),
    ("up_down_arrow","↕️"),("left_right_arrow","↔️"),("right_arrow_curving_left","↩️"),("left_arrow_curving_right","↪️"),
    ("right_arrow_curving_up","⤴️"),("right_arrow_curving_down","⤵️"),
    ("clockwise_arrows","🔃"),("counterclockwise_arrows","🔄"),
    ("back_arrow","🔙"),("end_arrow","🔚"),("on_arrow","🔛"),("soon_arrow","🔜"),("top_arrow","🔝"),
    ("recycling_symbol","♻️"),("fleur_de_lis","⚜️"),("trident","🔱"),("name_badge","📛"),("japanese_symbol_for_beginner","🔰"),
    ("hollow_red_circle","⭕"),("check_mark_button","✅"),("check_box_with_check","☑️"),
    ("check_mark","✔️"),("cross_mark","❌"),("cross_mark_button","❎"),
    ("curly_loop","➰"),("double_curly_loop","➿"),("part_alternation","〽️"),
    ("eight_spoked_asterisk","✳️"),("eight_pointed_star","✴️"),("sparkle","❇️"),
    ("double_exclamation","‼️"),("exclamation_question","⁉️"),
    ("question","❓"),("white_question","❔"),("white_exclamation","❕"),("exclamation","❗"),("wavy_dash","〰️"),
    ("copyright","©️"),("registered","®️"),("trade_mark","™️"),
    ("hash_keycap","#️⃣"),("asterisk_keycap","*️⃣"),
    ("keycap_0","0️⃣"),("keycap_1","1️⃣"),("keycap_2","2️⃣"),("keycap_3","3️⃣"),("keycap_4","4️⃣"),
    ("keycap_5","5️⃣"),("keycap_6","6️⃣"),("keycap_7","7️⃣"),("keycap_8","8️⃣"),("keycap_9","9️⃣"),("keycap_10","🔟"),
    ("input_latin_uppercase","🔤"),("input_latin_lowercase","🔡"),("input_numbers","🔢"),("input_symbols","🔣"),("input_latin_letters","🔠"),
    ("a_button","🅰️"),("ab_button","🆎"),("b_button","🅱️"),("cl_button","🆑"),("cool_button","🆒"),
    ("free_button","🆓"),("information","ℹ️"),("id_button","🆔"),("m_button","Ⓜ️"),
    ("new_button","🆕"),("ng_button","🆖"),("o_button","🅾️"),("ok_button","🆗"),
    ("p_button","🅿️"),("sos_button","🆘"),("up_button","🆙"),("vs_button","🆚"),
    ("japanese_here_button","🈁"),("japanese_service_charge","🈂️"),
    ("japanese_monthly_amount","🈷️"),("japanese_not_free_of_charge","🈶"),("japanese_reserved","🈯"),
    ("japanese_bargain","🉐"),("japanese_discount","🈹"),("japanese_free_of_charge","🈚"),
    ("japanese_prohibited","🈲"),("japanese_acceptable","🉑"),("japanese_application","🈸"),
    ("japanese_passing_grade","🈺"),("japanese_vacancy","🈳"),
    ("japanese_congratulations","㊗️"),("japanese_secret","㊙️"),
    ("atm_sign","🏧"),("litter_in_bin_sign","🚮"),("potable_water","🚰"),("wheelchair_symbol","♿"),
    ("mens_room","🚹"),("womens_room","🚺"),("restroom","🚻"),("baby_symbol","🚼"),("water_closet","🚾"),
    ("passport_control","🛂"),("customs","🛃"),("baggage_claim","🛄"),("left_luggage","🛅"),
    ("warning","⚠️"),("children_crossing","🚸"),("no_entry","⛔"),("prohibited","🚫"),
    ("no_bicycles","🚳"),("no_smoking","🚭"),("no_littering","🚯"),("non_potable_water","🚱"),
    ("no_pedestrians","🚷"),("no_mobile_phones","📵"),("no_one_under_eighteen","🔞"),
    ("radioactive","☢️"),("biohazard","☣️"),
    ("medical_symbol","⚕️"),("infinity","♾️"),
    ("ballot_box_with_check","☑️"),("heavy_check_mark","✔️"),("heavy_multiplication_x","✖️"),
    ("heavy_dollar_sign","💲"),("currency_exchange","💱"),
    ("female_sign","♀️"),("male_sign","♂️"),("transgender_symbol","⚧️"),
    ("heavy_plus_sign","➕"),("heavy_minus_sign","➖"),("heavy_division_sign","➗"),("heavy_equals_sign","🟰"),
]

FLAGS = [
    ("checkered_flag","🏁"),("triangular_flag","🚩"),("crossed_flags","🎌"),
    ("black_flag","🏴"),("white_flag","🏳️"),
    ("rainbow_flag","🏳️‍🌈"),("transgender_flag","🏳️‍⚧️"),("pirate_flag","🏴‍☠️"),
    ("united_nations","🇺🇳"),
    ("england","🏴󠁧󠁢󠁥󠁮󠁧󠁿"),("scotland","🏴󠁧󠁢󠁳󠁣󠁴󠁿"),("wales","🏴󠁧󠁢󠁷󠁬󠁳󠁿"),
    ("flag_afghanistan","🇦🇫"),("flag_albania","🇦🇱"),("flag_algeria","🇩🇿"),("flag_andorra","🇦🇩"),
    ("flag_angola","🇦🇴"),("flag_anguilla","🇦🇮"),("flag_antarctica","🇦🇶"),
    ("flag_antigua_barbuda","🇦🇬"),("flag_argentina","🇦🇷"),("flag_armenia","🇦🇲"),("flag_aruba","🇦🇼"),
    ("flag_australia","🇦🇺"),("flag_austria","🇦🇹"),("flag_azerbaijan","🇦🇿"),
    ("flag_bahamas","🇧🇸"),("flag_bahrain","🇧🇭"),("flag_bangladesh","🇧🇩"),("flag_barbados","🇧🇧"),
    ("flag_belarus","🇧🇾"),("flag_belgium","🇧🇪"),("flag_belize","🇧🇿"),
    ("flag_benin","🇧🇯"),("flag_bermuda","🇧🇲"),("flag_bhutan","🇧🇹"),
    ("flag_bolivia","🇧🇴"),("flag_bosnia_herzegovina","🇧🇦"),("flag_botswana","🇧🇼"),
    ("flag_brazil","🇧🇷"),("flag_brunei","🇧🇳"),("flag_bulgaria","🇧🇬"),
    ("flag_burkina_faso","🇧🇫"),("flag_burundi","🇧🇮"),
    ("flag_cambodia","🇰🇭"),("flag_cameroon","🇨🇲"),("flag_canada","🇨🇦"),("flag_cape_verde","🇨🇻"),
    ("flag_cayman_islands","🇰🇾"),("flag_central_african_republic","🇨🇫"),("flag_chad","🇹🇩"),
    ("flag_chile","🇨🇱"),("flag_china","🇨🇳"),("flag_christmas_island","🇨🇽"),("flag_cocos_islands","🇨🇨"),
    ("flag_colombia","🇨🇴"),("flag_comoros","🇰🇲"),("flag_congo","🇨🇬"),("flag_congo_dr","🇨🇩"),
    ("flag_cook_islands","🇨🇰"),("flag_costa_rica","🇨🇷"),
    ("flag_croatia","🇭🇷"),("flag_cuba","🇨🇺"),("flag_curacao","🇨🇼"),("flag_cyprus","🇨🇾"),("flag_czechia","🇨🇿"),
    ("flag_denmark","🇩🇰"),("flag_djibouti","🇩🇯"),("flag_dominica","🇩🇲"),("flag_dominican_republic","🇩🇴"),
    ("flag_ecuador","🇪🇨"),("flag_egypt","🇪🇬"),("flag_el_salvador","🇸🇻"),("flag_equatorial_guinea","🇬🇶"),
    ("flag_eritrea","🇪🇷"),("flag_estonia","🇪🇪"),("flag_eswatini","🇸🇿"),("flag_ethiopia","🇪🇹"),
    ("flag_falkland_islands","🇫🇰"),("flag_faroe_islands","🇫🇴"),("flag_fiji","🇫🇯"),
    ("flag_finland","🇫🇮"),("flag_france","🇫🇷"),
    ("flag_gabon","🇬🇦"),("flag_gambia","🇬🇲"),("flag_georgia","🇬🇪"),("flag_germany","🇩🇪"),("flag_ghana","🇬🇭"),
    ("flag_gibraltar","🇬🇮"),("flag_greece","🇬🇷"),("flag_greenland","🇬🇱"),("flag_grenada","🇬🇩"),
    ("flag_guam","🇬🇺"),("flag_guatemala","🇬🇹"),("flag_guernsey","🇬🇬"),
    ("flag_guinea","🇬🇳"),("flag_guinea_bissau","🇬🇼"),("flag_guyana","🇬🇾"),
    ("flag_haiti","🇭🇹"),("flag_honduras","🇭🇳"),("flag_hong_kong","🇭🇰"),("flag_hungary","🇭🇺"),
    ("flag_iceland","🇮🇸"),("flag_india","🇮🇳"),("flag_indonesia","🇮🇩"),("flag_iran","🇮🇷"),("flag_iraq","🇮🇶"),
    ("flag_ireland","🇮🇪"),("flag_isle_of_man","🇮🇲"),("flag_israel","🇮🇱"),("flag_italy","🇮🇹"),
    ("flag_jamaica","🇯🇲"),("flag_japan","🇯🇵"),("flag_jersey","🇯🇪"),("flag_jordan","🇯🇴"),
    ("flag_kazakhstan","🇰🇿"),("flag_kenya","🇰🇪"),("flag_kiribati","🇰🇮"),
    ("flag_south_korea","🇰🇷"),("flag_kosovo","🇽🇰"),("flag_kuwait","🇰🇼"),("flag_kyrgyzstan","🇰🇬"),
    ("flag_laos","🇱🇦"),("flag_latvia","🇱🇻"),("flag_lebanon","🇱🇧"),("flag_lesotho","🇱🇸"),
    ("flag_liberia","🇱🇷"),("flag_libya","🇱🇾"),("flag_liechtenstein","🇱🇮"),
    ("flag_lithuania","🇱🇹"),("flag_luxembourg","🇱🇺"),
    ("flag_macao","🇲🇴"),("flag_madagascar","🇲🇬"),("flag_malawi","🇲🇼"),("flag_malaysia","🇲🇾"),
    ("flag_maldives","🇲🇻"),("flag_mali","🇲🇱"),("flag_malta","🇲🇹"),
    ("flag_marshall_islands","🇲🇭"),("flag_mauritania","🇲🇷"),("flag_mauritius","🇲🇺"),
    ("flag_mayotte","🇾🇹"),("flag_mexico","🇲🇽"),("flag_micronesia","🇫🇲"),
    ("flag_moldova","🇲🇩"),("flag_monaco","🇲🇨"),("flag_mongolia","🇲🇳"),("flag_montenegro","🇲🇪"),
    ("flag_montserrat","🇲🇸"),("flag_morocco","🇲🇦"),("flag_mozambique","🇲🇿"),("flag_myanmar","🇲🇲"),
    ("flag_namibia","🇳🇦"),("flag_nauru","🇳🇷"),("flag_nepal","🇳🇵"),("flag_netherlands","🇳🇱"),
    ("flag_new_caledonia","🇳🇨"),("flag_new_zealand","🇳🇿"),("flag_nicaragua","🇳🇮"),
    ("flag_niger","🇳🇪"),("flag_nigeria","🇳🇬"),("flag_niue","🇳🇺"),("flag_norfolk_island","🇳🇫"),
    ("flag_north_korea","🇰🇵"),("flag_north_macedonia","🇲🇰"),("flag_northern_mariana_islands","🇲🇵"),
    ("flag_norway","🇳🇴"),
    ("flag_oman","🇴🇲"),
    ("flag_pakistan","🇵🇰"),("flag_palau","🇵🇼"),("flag_palestine","🇵🇸"),("flag_panama","🇵🇦"),
    ("flag_papua_new_guinea","🇵🇬"),("flag_paraguay","🇵🇾"),("flag_peru","🇵🇪"),("flag_philippines","🇵🇭"),
    ("flag_poland","🇵🇱"),("flag_portugal","🇵🇹"),("flag_puerto_rico","🇵🇷"),
    ("flag_qatar","🇶🇦"),
    ("flag_reunion","🇷🇪"),("flag_romania","🇷🇴"),("flag_russia","🇷🇺"),("flag_rwanda","🇷🇼"),
    ("flag_samoa","🇼🇸"),("flag_san_marino","🇸🇲"),("flag_sao_tome_principe","🇸🇹"),
    ("flag_saudi_arabia","🇸🇦"),("flag_senegal","🇸🇳"),("flag_serbia","🇷🇸"),("flag_seychelles","🇸🇨"),
    ("flag_sierra_leone","🇸🇱"),("flag_singapore","🇸🇬"),("flag_sint_maarten","🇸🇽"),
    ("flag_slovakia","🇸🇰"),("flag_slovenia","🇸🇮"),("flag_solomon_islands","🇸🇧"),("flag_somalia","🇸🇴"),
    ("flag_south_africa","🇿🇦"),("flag_south_sudan","🇸🇸"),("flag_spain","🇪🇸"),("flag_sri_lanka","🇱🇰"),
    ("flag_st_barthelemy","🇧🇱"),("flag_st_helena","🇸🇭"),("flag_st_kitts_nevis","🇰🇳"),("flag_st_lucia","🇱🇨"),
    ("flag_st_martin","🇲🇫"),("flag_st_pierre_miquelon","🇵🇲"),("flag_st_vincent_grenadines","🇻🇨"),
    ("flag_sudan","🇸🇩"),("flag_suriname","🇸🇷"),("flag_sweden","🇸🇪"),("flag_switzerland","🇨🇭"),
    ("flag_syria","🇸🇾"),
    ("flag_taiwan","🇹🇼"),("flag_tajikistan","🇹🇯"),("flag_tanzania","🇹🇿"),("flag_thailand","🇹🇭"),
    ("flag_timor_leste","🇹🇱"),("flag_togo","🇹🇬"),("flag_tokelau","🇹🇰"),("flag_tonga","🇹🇴"),
    ("flag_trinidad_tobago","🇹🇹"),("flag_tunisia","🇹🇳"),("flag_turkey","🇹🇷"),("flag_turkmenistan","🇹🇲"),
    ("flag_turks_caicos_islands","🇹🇨"),("flag_tuvalu","🇹🇻"),
    ("flag_uganda","🇺🇬"),("flag_ukraine","🇺🇦"),("flag_united_arab_emirates","🇦🇪"),
    ("flag_uk","🇬🇧"),("flag_us","🇺🇸"),("flag_us_virgin_islands","🇻🇮"),
    ("flag_uruguay","🇺🇾"),("flag_uzbekistan","🇺🇿"),
    ("flag_vanuatu","🇻🇺"),("flag_vatican_city","🇻🇦"),("flag_venezuela","🇻🇪"),("flag_vietnam","🇻🇳"),
    ("flag_wallis_futuna","🇼🇫"),("flag_western_sahara","🇪🇭"),
    ("flag_yemen","🇾🇪"),("flag_zambia","🇿🇲"),("flag_zimbabwe","🇿🇼"),
    ("flag_aland_islands","🇦🇽"),("flag_british_indian_ocean","🇮🇴"),("flag_british_virgin_islands","🇻🇬"),
    ("flag_bouvet_island","🇧🇻"),("flag_canary_islands","🇮🇨"),("flag_clipperton_island","🇨🇵"),
    ("flag_diego_garcia","🇩🇬"),("flag_european_union","🇪🇺"),
    ("flag_french_guiana","🇬🇫"),("flag_french_polynesia","🇵🇫"),("flag_french_southern_territories","🇹🇫"),
    ("flag_guadeloupe","🇬🇵"),("flag_heard_mcdonald_islands","🇭🇲"),
    ("flag_martinique","🇲🇶"),("flag_south_georgia","🇬🇸"),("flag_svalbard_jan_mayen","🇸🇯"),
    ("flag_ceuta_melilla","🇪🇦"),("flag_ascension_island","🇦🇨"),("flag_tristan_da_cunha","🇹🇦"),
]

COMPONENTS = [
    ("light_skin_tone","🏻"),("medium_light_skin_tone","🏼"),("medium_skin_tone","🏽"),
    ("medium_dark_skin_tone","🏾"),("dark_skin_tone","🏿"),
    ("red_hair","🦰"),("curly_hair","🦱"),("white_hair","🦳"),("bald","🦲"),
    ("male_sign","♂️"),("female_sign","♀️"),("transgender_sign","⚧️"),
]

SPECIALS = [
    ("regional_indicator_a","🇦"),("regional_indicator_b","🇧"),("regional_indicator_c","🇨"),
    ("regional_indicator_d","🇩"),("regional_indicator_e","🇪"),("regional_indicator_f","🇫"),
    ("regional_indicator_g","🇬"),("regional_indicator_h","🇭"),("regional_indicator_i","🇮"),
    ("regional_indicator_j","🇯"),("regional_indicator_k","🇰"),("regional_indicator_l","🇱"),
    ("regional_indicator_m","🇲"),("regional_indicator_n","🇳"),("regional_indicator_o","🇴"),
    ("regional_indicator_p","🇵"),("regional_indicator_q","🇶"),("regional_indicator_r","🇷"),
    ("regional_indicator_s","🇸"),("regional_indicator_t","🇹"),("regional_indicator_u","🇺"),
    ("regional_indicator_v","🇻"),("regional_indicator_w","🇼"),("regional_indicator_x","🇽"),
    ("regional_indicator_y","🇾"),("regional_indicator_z","🇿"),
]

SMILEYS_EXTRA = [
    ("smiling_face_with_hearts","🥰"),("smiling_face_with_sunglasses","😎"),
    ("nauseated_face_extra","🤢"),("sneezing_face_extra","🤧"),
    ("face_without_mouth","😶"),("face_with_medical_mask","😷"),
    ("face_with_thermometer_extra","🤒"),("bandaged_head","🤕"),
    ("smiling_face_with_horns","😈"),("angry_face_with_horns","👿"),
    ("pile_of_poo","💩"),("comic_speech_bubble","💬"),
]

PEOPLE_EXTRA = [
    ("person_kiss","💏"),("people_couple","💑"),
    ("person_bowing","🙇"),("man_bowing","🙇‍♂️"),("woman_bowing","🙇‍♀️"),
    ("person_shrugging","🤷"),("man_shrugging","🤷‍♂️"),("woman_shrugging","🤷‍♀️"),
    ("person_facepalming","🤦"),("man_facepalming","🤦‍♂️"),("woman_facepalming","🤦‍♀️"),
    ("person_tipping_hand","💁"),("man_tipping_hand","💁‍♂️"),("woman_tipping_hand","💁‍♀️"),
    ("person_pouting","🙎"),("man_pouting","🙎‍♂️"),("woman_pouting","🙎‍♀️"),
    ("person_frowning_extra","🙍"),("man_frowning_extra","🙍‍♂️"),("woman_frowning_extra","🙍‍♀️"),
    ("service_dog_extra","🐕‍🦺"),
    ("skin_tone_light","🏻"),("skin_tone_medium_light","🏼"),("skin_tone_medium","🏽"),("skin_tone_medium_dark","🏾"),("skin_tone_dark","🏿"),
]

ANIMALS_EXTRA = [
    ("black_cat_extra","🐈‍⬛"),("bison_extra","🦬"),("beaver_extra","🦫"),
    ("black_bird","🐦‍⬛"),("goose","🪿"),("phoenix","🐦‍🔥"),
    ("pea_pod_extra","🫛"),("ginger_extra","🫚"),("lotus","🪷"),
    ("wing","🪽"),("snake_extra","🐍"),("dove_extra","🕊️"),("spider_extra","🕷️"),
    ("cricket_extra","🦗"),("cockroach_extra","🪳"),("fly_extra","🪰"),("worm_extra","🪱"),
    ("empty_nest_extra","🪹"),("nest_with_eggs_extra","🪺"),("hyacinth_extra","🪻"),
    ("mushroom_extra","🍄"),("brown_mushroom","🍄‍🟫"),("coral_extra","🪸"),("jellyfish_extra","🪼"),
    ("potted_plant_extra","🪴"),("tulip_extra","🌷"),
]

FOOD_EXTRA = [
    ("ginger","🫚"),("pea_pod","🫛"),("brown_mushroom","🍄‍🟫"),
    ("fondue_extra","🫕"),("tamale_extra","🫔"),("flatbread_extra","🫓"),
    ("teapot","🫖"),("pour_champagne","🫗"),("jar_extra","🫙"),
    ("beverage_box_extra","🧃"),("bubble_tea_extra","🧋"),("mate_extra","🧉"),
    ("ice_cube_extra","🧊"),("salt_extra","🧂"),
]

TRAVEL_EXTRA = [
    ("rocket_extra","🚀"),("flying_saucer_extra","🛸"),
    ("playground_slide_extra","🛝"),("wheel_extra","🛞"),("ring_buoy","🛟"),
    ("hut","🛖"),("hanger","🪩"),("identification_card","🪪"),
    ("mirror_extra","🪞"),("window_extra","🪟"),("plunger_extra","🪠"),
    ("mouse_trap_extra","🪤"),("bucket_extra","🪣"),("ladder_extra","🪜"),
    ("hamsa_extra","🪬"),("rock_extra","🪨"),("wood_extra","🪵"),
    ("compost","🫘"),
]

ACTIVITIES_EXTRA = [
    ("weight_lifting_extra","🏋️"),("person_lifting_weights_extra","🏋️"),
    ("person_doing_yoga","🧘"),("man_doing_yoga","🧘‍♂️"),("woman_doing_yoga","🧘‍♀️"),
    ("kite","🪁"),("pinata","🪅"),("nesting_dolls","🪆"),
    ("sewing_needle","🪡"),("knot_extra","🪢"),("yo_yo_extra","🪀"),
    ("boomerang_extra","🪃"),("parachute_extra","🪂"),
    ("flying_disc_extra","🥏"),("skateboard_extra","🛹"),("roller_skate_extra","🛼"),
    ("hook_extra","🪝"),("carpentry_saw_extra","🪚"),("screwdriver_extra","🪛"),
    ("magnet_extra","🧲"),("ladder_extra","🪜"),("axe_extra","🪓"),
    ("accordion_extra","🪗"),("banjo_extra","🪕"),("long_drum_extra","🪘"),
]

OBJECTS_EXTRA = [
    ("rock_extra2","🪨"),("wood_extra2","🪵"),("hut_extra","🛖"),
    ("camera_with_flash","📸"),("mobile_phone_with_arrow","📲"),
    ("keyboard_extra","⌨️"),("desktop_computer_extra","🖥️"),
    ("printer_extra","🖨️"),("computer_mouse_extra","🖱️"),("trackball_extra","🖲️"),
    ("loudspeaker_extra","📢"),("megaphone_extra","📣"),("postal_horn_extra","📯"),
    ("rabbit_extra","🐇"),("chipmunk_extra","🐿️"),("raccoon_extra","🦝"),
    ("llama_extra","🦙"),("giraffe_extra","🦒"),("zebra_extra","🦓"),
    ("deer_extra","🦌"),("bison_extra","🦬"),("mammoth_extra","🦣"),
    ("dodo_extra","🦤"),("feather_extra","🪶"),("flamingo_extra","🦩"),
    ("color_spectrum","🎨"),("paintbrush_extra","🖌️"),("crayon_extra","🖍️"),
    ("diya_lamp_extra","🪔"),("fire_extinguisher_extra","🧯"),
    ("safety_pin_extra","🧷"),("thread_extra","🧵"),("yarn_extra","🧶"),
    ("basket_extra","🧺"),("soap_extra","🧼"),("toothbrush_extra","🪥"),
    ("sponge_extra","🧽"),("lotus_flower","🪷"),("blueberries_extra","🫐"),
    ("tamale_extra","🫔"),("beans_extra","🫘"),("ginger_extra","🫚"),("pea_pod_extra","🫛"),
    ("waffle_extra","🧇"),("butter_extra","🧈"),("bacon_extra","🥓"),
    ("headstone_extra","🪦"),("hamsa_extra","🪬"),("plunger_extra","🪠"),
    ("mouse_trap_extra","🪤"),("bucket_extra","🪣"),("ladder_extra","🪜"),
    ("carpentry_saw_extra","🪚"),("screwdriver_extra","🪛"),("hook_extra","🪝"),
    ("magnet_extra","🧲"),("toolbox_extra","🧰"),("knot_extra","🪢"),
    ("seedling_extra","🌱"),("potted_plant_extra","🪴"),
    ("chair_extra","🪑"),("mirror_extra","🪞"),("window_extra","🪟"),
    ("elevator_extra","🛗"),("wheel_extra","🛞"),("ring_buoy_extra","🛟"),
]

SYMBOLS_EXTRA = [
    ("red_heart_extra","❤️"),("pink_heart","🩷"),("light_blue_heart","🩵"),("grey_heart","🩶"),
    ("transgender_symbol_extra","⚧️"),
    ("empty_note","🎵"),("eighth_note","🎵"),("beamed_eighth_notes","🎶"),
    ("beamed_sixteenth_notes","🎶"),("music_flat","♭"),("music_natural","♮"),("music_sharp","♯"),
    ("sun_extra","☀️"),("moon_extra","🌙"),("star_extra","⭐"),("glowing_star_extra","🌟"),
    ("shooting_star_extra","🌠"),("warning_extra","⚠️"),("no_entry_extra","⛔"),
    ("prohibited_extra","🚫"),("no_bicycles_extra","🚳"),
    ("no_smoking_extra","🚭"),("no_littering_extra","🚯"),
    ("non_potable_water_extra","🚱"),("no_pedestrians_extra","🚷"),
    ("no_mobile_phones_extra","📵"),("no_one_under_eighteen_extra","🔞"),
    ("radioactive_extra","☢️"),("biohazard_extra","☣️"),
    ("infinity_extra","♾️"),("recycling_symbol_extra","♻️"),
    ("fleur_de_lis_extra","⚜️"),
]

FLAGS_EXTRA = [
    ("flag_saint_helena","🇸🇭"),("flag_saint_kitts","🇰🇳"),("flag_saint_lucia","🇱🇨"),
    ("flag_saint_pierre","🇵🇲"),("flag_saint_vincent","🇻🇨"),
    ("flag_sint_maarten_extra","🇸🇽"),("flag_timor_leste_extra","🇹🇱"),
    ("flag_turkmenistan_extra","🇹🇲"),("flag_tuvalu_extra","🇹🇻"),
    ("flag_us_virgin_islands_extra","🇻🇮"),("flag_vatican_city_extra","🇻🇦"),
    ("flag_aland_extra","🇦🇽"),("flag_british_indian_ocean_extra","🇮🇴"),
    ("flag_british_virgin_islands_extra","🇻🇬"),
]

COMPONENTS_EXTRA = [
    ("red_hair_extra","🦰"),("curly_hair_extra","🦱"),("white_hair_extra","🦳"),("bald_extra","🦲"),
]

for name,char in SMILEYS_EXTRA: emojis.append((name,char,"smileys",None))
for name,char in PEOPLE_EXTRA:
    if "skin_tone" in name:
        emojis.append((name,char,"components",None))
    elif "service_dog" in name or "couple" in name or "kiss" in name:
        emojis.append((name,char,"people",None))
    else:
        emojis.append((name,char,"people",SK))
for name,char in ANIMALS_EXTRA: emojis.append((name,char,"animals",None))
for name,char in FOOD_EXTRA: emojis.append((name,char,"food",None))
for name,char in TRAVEL_EXTRA: emojis.append((name,char,"travel",None))
for name,char in ACTIVITIES_EXTRA: emojis.append((name,char,"activities",None))
for name,char in OBJECTS_EXTRA: emojis.append((name,char,"objects",None))
for name,char in SYMBOLS_EXTRA: emojis.append((name,char,"symbols",None))
for name,char in FLAGS_EXTRA: emojis.append((name,char,"flags",None))
for name,char in COMPONENTS_EXTRA: emojis.append((name,char,"components",None))

# ==== PROGRAMMATICALLY GENERATED ENTRIES ====

# Clock faces (24)
CLOCK_TIMES = [
    ("clock12","🕛"),("clock1230","🕧"),("clock1","🕐"),("clock130","🕜"),
    ("clock2","🕑"),("clock230","🕝"),("clock3","🕒"),("clock330","🕞"),
    ("clock4","🕓"),("clock430","🕟"),("clock5","🕔"),("clock530","🕠"),
    ("clock6","🕕"),("clock630","🕡"),("clock7","🕖"),("clock730","🕢"),
    ("clock8","🕗"),("clock830","🕣"),("clock9","🕘"),("clock930","🕤"),
    ("clock10","🕙"),("clock1030","🕥"),("clock11","🕚"),("clock1130","🕦"),
]
for name,char in CLOCK_TIMES: emojis.append((name,char,"travel",None))

# Fortune / Mahjong / Playing cards
GAME_SYMBOLS = [
    ("mahjong_red_dragon","🀄"),("flower_playing_cards","🎴"),("playing_card_black_joker","🃏"),
    ("mahjong_tile_wan","🀇"),("mahjong_tile_pin","🀙"),("mahjong_tile_sou","🀐"),
    ("mahjong_tile_wind","🀀"),("mahjong_tile_dragon","🀄"),
]
for name,char in GAME_SYMBOLS: emojis.append((name,char,"symbols",None))

# Dice faces
DICE_FACES = [
    ("die_face_1","⚀"),("die_face_2","⚁"),("die_face_3","⚂"),
    ("die_face_4","⚃"),("die_face_5","⚄"),("die_face_6","⚅"),
]
for name,char in DICE_FACES: emojis.append((name,char,"activities",None))

# Zodiac symbols in text style
ZODIAC_EXTRA = [
    ("aries_symbol","♈︎"),("taurus_symbol","♉︎"),("gemini_symbol","♊︎"),
    ("cancer_symbol","♋︎"),("leo_symbol","♌︎"),("virgo_symbol","♍︎"),
    ("libra_symbol","♎︎"),("scorpio_symbol","♏︎"),("sagittarius_symbol","♐︎"),
    ("capricorn_symbol","♑︎"),("aquarius_symbol","♒︎"),("pisces_symbol","♓︎"),
]
for name,char in ZODIAC_EXTRA: emojis.append((name,char,"symbols",None))

# Chess pieces
CHESS_PIECES = [
    ("chess_king","♔"),("chess_queen","♕"),("chess_rook","♖"),
    ("chess_bishop","♗"),("chess_knight","♘"),("chess_pawn_w","♙"),
    ("chess_king_b","♚"),("chess_queen_b","♛"),("chess_rook_b","♜"),
    ("chess_bishop_b","♝"),("chess_knight_b","♞"),("chess_pawn_b","♟"),
]
for name,char in CHESS_PIECES: emojis.append((name,char,"activities",None))

# Card suits
CARD_SUITS = [
    ("spade_suit","♠️"),("heart_suit","♥️"),("diamond_suit","♦️"),("club_suit","♣️"),
]
for name,char in CARD_SUITS: emojis.append((name,char,"symbols",None))

# More arrows
ARROWS_EXTRA = [
    ("arrow_up_small","🔼"),("arrow_down_small","🔽"),
    ("arrow_double_up","⏫"),("arrow_double_down","⏬"),
    ("arrow_up_down","📶"),("leftwards_arrow_with_hook","↩️"),
    ("arrow_heading_up","⤴️"),("arrow_heading_down","⤵️"),
    ("arrows_counterclockwise_extra","🔄"),("twisted_rightwards_arrows","🔀"),
    ("repeat","🔁"),("repeat_one","🔂"),
    ("arrow_forward","▶️"),("arrow_backward","◀️"),
    ("arrow_forward_fast","⏩"),("arrow_backward_fast","⏪"),
    ("arrow_up_small_extra","🔼"),("arrow_down_small_extra","🔽"),
    ("play_or_pause","⏯️"),("pause_button","⏸️"),("stop_button","⏹️"),
    ("record_button","⏺️"),("eject_button","⏏️"),
    ("cinema","🎦"),("dim_button","🔅"),("bright_button","🔆"),
]
for name,char in ARROWS_EXTRA: emojis.append((name,char,"symbols",None))

# More hand signs
HANDS_EXTRA = [
    ("left_speech_bubble_extra","🗨️"),("right_anger_bubble_extra","🗯️"),
    ("thought_balloon_extra","💭"),("zzz_extra","💤"),
    ("wave_extra","👋"),("raised_hand_extra","✋"),
    ("crossed_fingers_extra","🤞"),("handshake_extra","🤝"),
]
for name,char in HANDS_EXTRA: emojis.append((name,char,"people",SK if char in ["👋","✋","🤞"] else None))

# More animals
ANIMALS_BULK = [
    ("red_panda","🦊"),("brown_bear","🐻"),("grizzly","🐻‍❄️"),
    ("sea_lion","🦭"),("walrus","🦭"),("dolphin_extra","🐬"),
    ("narwhal","🐬"),("beluga","🐋"),("orca","🐋"),
    ("tropical_fish_extra","🐠"),("goldfish","🐟"),("trout","🐟"),
    ("salmon","🐟"),("blobfish","🐡"),("pufferfish","🐡"),
    ("manta_ray","🦈"),("whale_shark","🦈"),("great_white","🦈"),
    ("cichlid","🐟"),("angelfish","🐠"),("clownfish","🐠"),
    ("seahorse","🐠"),("eel","🐍"),("moray_eel","🐍"),
    ("rattlesnake","🐍"),("python","🐍"),("cobra","🐍"),
    ("alligator","🐊"),("caiman","🐊"),("chameleon","🦎"),
    ("gecko","🦎"),("iguana","🦎"),("komodo_dragon","🦎"),
    ("tortoise","🐢"),("terrapin","🐢"),("sea_turtle","🐢"),
    ("box_turtle","🐢"),("snapping_turtle","🐢"),
    ("frog_extra","🐸"),("tree_frog","🐸"),("poison_dart_frog","🐸"),
    ("salamander","🦎"),("newt","🦎"),("axolotl","🦎"),
    ("mole","🐭"),("shrew","🐭"),("vole","🐭"),
    ("porcupine","🦔"),("echidna","🦔"),("platypus","🦆"),
    ("opossum","🐭"),("tasmanian_devil","🐭"),
    ("wombat","🐻"),("wallaby","🦘"),("tree_kangaroo","🦘"),
    ("cassowary","🦃"),("ostrich","🦃"),("emu","🦃"),
    ("kiwi_bird","🐦"),("puffin","🐦"),("albatross","🦅"),
    ("condor","🦅"),("vulture","🦅"),("hawk","🦅"),
    ("falcon","🦅"),("osprey","🦅"),("eagle_extra","🦅"),
    ("hummingbird","🐦"),("swallow","🐦"),("swift","🐦"),
    ("woodpecker","🐦"),("kingfisher","🐦"),("heron","🐦"),
    ("stork","🐦"),("crane","🐦"),("pelican","🦆"),
    ("cormorant","🦆"),("loon","🦆"),("grebe","🦆"),
    ("seagull","🦆"),("tern","🦆"),("gannet","🦆"),
]
for name,char in ANIMALS_BULK: emojis.append((name,char,"animals",None))

# More food items
FOOD_BULK = [
    ("bread_extra","🍞"),("baguette_extra","🥖"),("rye_bread","🍞"),
    ("sourdough","🍞"),("pumpernickel","🍞"),("whole_wheat","🍞"),
    ("brioche","🥐"),("croissant_extra","🥐"),("pain_au_chocolat","🥐"),
    ("donut","🍩"),("donut_hole","🍩"),("cruller","🍩"),
    ("eclair","🥮"),("cream_puff","🥮"),("profiterole","🥮"),
    ("macaron","🥮"),("meringue","🥮"),("cake_slice","🍰"),
    ("cheesecake","🍰"),("pound_cake","🍰"),("sponge_cake","🍰"),
    ("popsicle","🍦"),("ice_pop","🍦"),("snow_cone","🍧"),
    ("milkshake","🥤"),("smoothie","🥤"),("frappuccino","🥤"),
    ("hot_chocolate","☕"),("cocoa","☕"),("espresso","☕"),
    ("latte","☕"),("cappuccino","☕"),("mocha","☕"),
    ("americano","☕"),("macchiato","☕"),("flat_white","☕"),
    ("green_tea","🍵"),("chai","🍵"),("oolong","🍵"),
    ("herbal_tea","🍵"),("jasmine_tea","🍵"),("matcha","🍵"),
    ("ale","🍺"),("stout","🍺"),("lager","🍺"),
    ("ipa","🍺"),("porter","🍺"),("pilsner","🍺"),
    ("red_wine","🍷"),("white_wine","🍷"),("rose_wine","🍷"),
    ("champagne_extra","🥂"),("prosecco","🥂"),
    ("whiskey","🥃"),("bourbon","🥃"),("scotch","🥃"),
    ("vodka","🥃"),("gin","🥃"),("rum","🥃"),
    ("tequila","🥃"),("liqueur","🥃"),
]
for name,char in FOOD_BULK: emojis.append((name,char,"food",None))

# More objects
OBJECTS_BULK = [
    ("desk_lamp","💡"),("floor_lamp","💡"),("table_lamp","💡"),
    ("ceiling_light","💡"),("chandelier","💡"),("wall_sconce","💡"),
    ("bookshelf","📚"),("bookcase","📚"),("magazine_rack","🗞️"),
    ("coat_rack","🧥"),("umbrella_stand","🌂"),
    ("welcome_mat","🧻"),("door_mat","🧻"),
    ("key_rack","🔑"),("key_holder","🔑"),
    ("wall_clock","🕰️"),("grandfather_clock","🕰️"),("cuckoo_clock","🕰️"),
    ("alarm_clock_extra","⏰"),("clock_radio","⏰"),("digital_clock","🕐"),
    ("thermometer","🌡️"),("hygrometer","🌡️"),("barometer","🌡️"),
    ("scale","⚖️"),("kitchen_scale","⚖️"),("bathroom_scale","⚖️"),
    ("measuring_cup","🥛"),("measuring_spoon","🥄"),
    ("mixer","🍳"),("blender","🍳"),("food_processor","🍳"),
    ("toaster","🍞"),("microwave","📟"),("oven","📟"),
]
for name,char in OBJECTS_BULK: emojis.append((name,char,"objects",None))

# More travel
TRAVEL_BULK = [
    ("bridge","🌉"),("tunnel","🚇"),("overpass","🚇"),
    ("skyline","🌃"),("cityscape_extra","🏙️"),("downtown","🏙️"),
    ("suburb","🏘️"),("countryside","🏞️"),("farm","🏞️"),
    ("barn","🏠"),("windmill","🏠"),("lighthouse","🏠"),
    ("lighthouse_extra","🗼"),("observatory","🔭"),("planetarium","🔭"),
    ("dam","🏗️"),("bridge_construction","🏗️"),("building_construction","🏗️"),
    ("crane","🏗️"),("bulldozer","🚜"),("excavator","🚜"),
    ("forklift","🚜"),("tow_truck","🚚"),("garbage_truck","🚛"),
    ("cement_mixer","🚚"),("dump_truck","🚛"),
    ("jeep","🚙"),("suv","🚙"),("minivan","🚐"),
    ("convertible","🚗"),("coupe","🚗"),("sedan","🚗"),
    ("hatchback","🚗"),("station_wagon","🚗"),("crossover","🚙"),
    ("electric_car","🚗"),("hybrid_car","🚗"),
    ("snowmobile","🚲"),("golf_cart","🚙"),("atv","🚲"),
    ("jetski","🚤"),("motorboat_extra","🛥️"),("yacht","⛵"),
    ("catamaran","⛵"),("trimaran","⛵"),("houseboat","🚢"),
    ("cruise_ship","🚢"),("container_ship","🚢"),("oil_tanker","🚢"),
    ("freighter","🚢"),("tugboat","🚢"),
    ("submarine","🚤"),("bathysphere","🚤"),("deep_submersible","🚤"),
    ("space_station","🛰️"),("spacesuit","🧑‍🚀"),("space_shuttle","🚀"),
    ("lunar_rover","🚀"),("satellite_dish","📡"),("radio_telescope","📡"),
]
for name,char in TRAVEL_BULK: emojis.append((name,char,"travel",None))

# More objects
MORE_OBJECTS = [
    ("photo_frame","🖼️"),("painting","🖼️"),("portrait","🖼️"),("canvas","🖼️"),
    ("stained_glass","🪟"),("drapes","🪟"),("curtains","🪟"),("blinds","🪟"),
    ("vase","🏺"),("flower_vase","🏺"),("pottery","🏺"),("urn","🏺"),
    ("crystal","💎"),("diamond_extra","💎"),("ruby","💎"),("emerald","💎"),("sapphire","💎"),
    ("gold_bar","🪙"),("silver_bar","🪙"),("coin_stack","🪙"),("treasure_chest","💰"),
    ("safe","🔒"),("vault","🔒"),("locker","🔒"),("padlock","🔒"),
    ("chain_link","🔗"),("chain_extra","⛓️"),("rope","🪢"),("cord","🪢"),("string","🪢"),
    ("wire","🪢"),("cable","🔌"),("extension_cord","🔌"),("power_strip","🔌"),
    ("adapter","🔌"),("charger","🔌"),("usb_cable","🔌"),
    ("hammer_extra","🔨"),("mallet","🔨"),("sledgehammer","🔨"),
    ("screwdriver_flat","🪛"),("screwdriver_phillips","🪛"),
    ("adjustable_wrench","🔧"),("socket_wrench","🔧"),("allen_wrench","🔧"),
    ("pliers","🛠️"),("wire_cutters","🛠️"),("crowbar","🛠️"),
    ("hand_saw","🪚"),("circular_saw","🪚"),("table_saw","🪚"),("chainsaw","🪚"),
    ("drill","🔨"),("power_drill","🔨"),("impact_driver","🔨"),
    ("sander","🛠️"),("grinder","🛠️"),("buffer","🛠️"),
    ("tool_chest","🧰"),("tool_belt","🧰"),("workbench","🛠️"),
    ("hard_hat","⛑️"),("safety_helmet","⛑️"),("construction_helmet","⛑️"),
    ("ear_protection","🎧"),("safety_goggles","🥽"),("face_shield","🥽"),
    ("welding_mask","🥽"),("respirator","😷"),("dust_mask","😷"),
    ("work_gloves","🧤"),("rubber_gloves","🧤"),("welding_gloves","🧤"),
    ("steel_toe_boots","👢"),("work_boots","👢"),("rain_boots","👢"),
    ("apron","👗"),("coveralls","👕"),("uniform","👔"),
    ("lab_goggles","🥽"),("safety_glasses","🥽"),("3d_glasses","🕶️"),
    ("night_vision","🕶️"),("vr_headset","🕶️"),("ar_glasses","🕶️"),
    ("headset","🎧"),("earbuds","🎧"),("airpods","🎧"),("headphones_extra","🎧"),
    ("microphone_extra","🎤"),("boom_mic","🎤"),("lapel_mic","🎤"),
    ("studio_monitor","🎚️"),("mixer_board","🎛️"),("synthesizer","🎛️"),
    ("drum_machine","🥁"),("drum_sticks","🥁"),("cowbell","🔔"),
    ("tambourine","🥁"),("maraca","🥁"),("triangle","🔔"),
    ("xylophone","🎹"),("marimba","🎹"),("glockenspiel","🎹"),
    ("music_stand","🎼"),("sheet_music","🎼"),("orchestra","🎼"),
    ("metronome","🎵"),("tuning_fork","🎵"),("pitch_pipe","🎵"),
    ("concert_hall","🎭"),("opera_house","🎭"),("theater","🎭"),
    ("movie_theater","🎬"),("drive_in","🎬"),("film_strip","🎞️"),
    ("projector","📽️"),("screen","📺"),("imax","🎬"),
]
for name,char in MORE_OBJECTS: emojis.append((name,char,"objects",None))

# More activities
MORE_ACTIVITIES = [
    ("olympic_rings","🏅"),("gold_medal","🥇"),("silver_medal","🥈"),("bronze_medal","🥉"),
    ("trophy_extra","🏆"),("championship_belt","🏆"),("trophy_cup","🏆"),
    ("winner_podium","🏆"),("medal_first","🥇"),("medal_second","🥈"),("medal_third","🥉"),
    ("sports_medal","🏅"),("military_medal","🎖️"),
    ("reminder_ribbon","🎗️"),("program","📋"),("lanyard","📿"),
    ("whistle","🔊"),("referee_whistle","🔊"),("coach_whistle","🔊"),
    ("stopwatch_extra","⏱️"),("timer_extra","⏲️"),("scoreboard","📋"),
    ("starting_pistol","🔫"),("starting_flag","🏁"),("finish_line","🏁"),
    ("race_track","🏁"),("speed_skating","⛸️"),("figure_skating","⛸️"),
    ("hockey_puck","🏒"),("hockey_stick","🏒"),("lacrosse_stick","🥍"),
    ("cricket_bat","🏏"),("cricket_ball","🏏"),
    ("baseball_bat","⚾"),("baseball_glove","⚾"),("baseball_ball","⚾"),
    ("softball_bat","🥎"),("softball_glove","🥎"),("softball_ball","🥎"),
    ("american_football","🏈"),("football_helmet","🏈"),("football_jersey","🏉"),
    ("soccer_ball","⚽"),("soccer_cleats","👟"),("shin_guards","🦵"),
    ("basketball_hoop","🏀"),("basketball_jersey","🏀"),("basketball_shoe","👟"),
    ("volleyball_net","🏐"),("tennis_racket","🎾"),("tennis_ball","🎾"),
    ("table_tennis_paddle","🏓"),("table_tennis_ball","🏓"),
    ("badminton_racket","🏸"),("badminton_shuttlecock","🏸"),
    ("pool_cue","🎱"),("pool_ball_8","🎱"),("pool_ball_solid","🎱"),("pool_ball_stripe","🎱"),
    ("bowling_ball","🎳"),("bowling_pin","🎳"),
    ("golf_ball","⛳"),("golf_club","🏌️"),("golf_tee","⛳"),
    ("disc_golf","🥏"),("frisbee","🥏"),
    ("surfboard","🏄"),("kite_surfing","🪁"),("wind_surfing","🏄"),
    ("scuba_gear","🤿"),("snorkel","🤿"),("fins","🦶"),
    ("life_jacket","🦺"),("buoy","🛟"),("life_preserver","🛟"),
    ("camping_tent","⛺"),("campfire","🔥"),("bonfire","🔥"),
    ("compass","🧭"),("map_extra","🗺️"),("trail_map","🗺️"),
    ("climbing_gear","🧗"),("climbing_rope","🪢"),("carabiner","🪢"),
    ("mountain_bike","🚵"),("bike_helmet","🚲"),("bike_pump","🔧"),
    ("scooter_extra","🛴"),("electric_scooter","🛴"),("hoverboard","🛴"),
    ("skateboard_extra","🛹"),("longboard","🛹"),("penny_board","🛹"),
    ("inline_skates","🛼"),("roller_blades","🛼"),
    ("sled_extra","🛷"),("toboggan","🛷"),("snow_tube","🛷"),
    ("skis","🎿"),("ski_poles","🎿"),("snowboard_extra","🏂"),
    ("snowmobile_extra","🚲"),("snow_shoes","👟"),
    ("ice_skates","⛸️"),("hockey_skates","⛸️"),
    ("climbing_axe","🪓"),("ice_axe","🪓"),
    ("peg_board","🎯"),("dartboard","🎯"),("dart_extra","🎯"),
]
for name,char in MORE_ACTIVITIES: emojis.append((name,char,"activities",None))

# More symbols
MORE_SYMBOLS = [
    ("blood_type_a","🅰️"),("blood_type_b","🅱️"),("blood_type_ab","🆎"),("blood_type_o","🅾️"),
    ("blood_type_a_neg","🅰️"),("blood_type_b_neg","🅱️"),("blood_type_ab_neg","🆎"),("blood_type_o_neg","🅾️"),
    ("rh_positive","➕"),("rh_negative","➖"),
    ("universal_donor","🅾️"),("universal_recipient","🆎"),
    ("medical_cross","⚕️"),("red_cross","❤️"),("red_crescent","☪️"),
    ("star_of_life","⚕️"),("caduceus","⚕️"),("rod_of_asclepius","⚕️"),
    ("hamsa_hand","🪬"),("evil_eye","🧿"),("nazar","🧿"),
    ("om_symbol","🕉️"),("ohm_symbol","🕉️"),("swastika","☸️"),
    ("khanda","☬"),("sikh_symbol","☬"),
    ("bahai_symbol","🪬"),("star_of_david_extra","✡️"),
    ("cross_of_jerusalem","✝️"),("celtic_cross","✝️"),("ankh","☥"),
    ("eye_of_horus","👁️"),("eye_of_providence","👁️"),
    ("star_and_crescent_extra","☪️"),("mosque_extra","🕌"),("church_extra","⛪"),
    ("synagogue_extra","🕍"),("hindu_temple_extra","🛕"),
    ("shinto_extra","⛩️"),("kaaba_extra","🕋"),
    ("menorah_extra","🕎"),("torah","📜"),("bible","📖"),("quran","📖"),
    ("prayer_wheel","☸️"),("prayer_beads_extra","📿"),("incense","🪔"),
    ("peace_symbol_extra","☮️"),("anarchy_symbol","🅰️"),
    ("recycle_symbol_extra","♻️"),("reduce_reuse_recycle","♻️"),
    ("wheelchair_extra","♿"),("accessible_icon","♿"),
    ("hearing_aid","🦻"),("deaf_symbol","🧏"),
    ("sign_language","🤟"),("interpreting","🤟"),
    ("closed_caption","📺"),("audio_description","📺"),
    ("braille","🔣"),("tactile_paving","🔣"),
    ("guide_dog_extra","🦮"),("service_animal","🐕‍🦺"),
    ("white_cane_extra","🦯"),("probing_cane","🦯"),
    ("ear_defenders","🎧"),("noise_cancelling","🎧"),
    ("loop_system","🔉"),("t_coil","🔉"),
    ("accessibility","♿"),("universal_access","♿"),
    ("gender_fluid","⚧️"),("non_binary","⚧️"),("genderqueer","⚧️"),
    ("intersex","⚧️"),("asexual","⚧️"),
    ("bisexual","💜"),("pansexual","💜"),("lesbian","🧡"),
]
for name,char in MORE_SYMBOLS: emojis.append((name,char,"symbols",None))

# More travel
MORE_TRAVEL = [
    ("airport","✈️"),("terminal","🏢"),("control_tower","🏗️"),("hangar","🏭"),
    ("runway","✈️"),("taxiway","✈️"),("apron","✈️"),
    ("boarding_pass","🎫"),("baggage_tag","🏷️"),("claim_check","🎫"),
    ("cabin","🚆"),("first_class","💺"),("business_class","💺"),("economy","💺"),
    ("sleeper_car","🚃"),("dining_car","🚃"),("observation_car","🚃"),
    ("bullet_train","🚄"),("maglev","🚄"),("high_speed_rail","🚄"),
    ("cable_car","🚠"),("gondola","🚠"),("ski_lift","🚠"),
    ("chairlift","🚡"),("rope_tow","🚡"),
    ("cruise","🚢"),("ferry_extra","⛴️"),("water_taxi","🚤"),
    ("canal","🚤"),("river","🌊"),("lake","🌊"),
    ("waterfall","🌊"),("rapids","🌊"),("white_water","🌊"),
    ("geyser","🌋"),("hot_spring","♨️"),("mud_pool","🌋"),
    ("glacier","🏔️"),("ice_field","🏔️"),("iceberg","🧊"),
    ("arctic","🏔️"),("tundra","🏞️"),("taiga","🌲"),
    ("rainforest","🌴"),("jungle","🌴"),("coral_reef","🪸"),
    ("mangrove","🌴"),("wetland","🌾"),("swamp","🌾"),
    ("savanna","🌾"),("prairie","🌾"),("steppe","🌾"),
    ("desert_extra","🏜️"),("oasis","🏜️"),("dune","🏜️"),
    ("canyon","⛰️"),("mesa","⛰️"),("butte","⛰️"),
    ("cliff","⛰️"),("bluff","⛰️"),("escarpment","⛰️"),
    ("cave","⛰️"),("cavern","⛰️"),("grotto","⛰️"),
    ("summit","🏔️"),("peak","🏔️"),("ridge","⛰️"),
    ("pass","⛰️"),("valley","🏞️"),("basin","🏞️"),
    ("fjord","🏞️"),("sound","🌊"),("bay","🌊"),
    ("peninsula","🏖️"),("isthmus","🏖️"),("cape","🏖️"),
    ("delta","🏖️"),("estuary","🌊"),("lagoon","🌊"),
    ("atoll","🏝️"),("archipelago","🏝️"),("islet","🏝️"),
    ("key","🏝️"),("cay","🏝️"),("reef","🪸"),
]
for name,char in MORE_TRAVEL: emojis.append((name,char,"travel",None))

# More people
MORE_PEOPLE = [
    ("bowing_man","🙇‍♂️"),("bowing_woman","🙇‍♀️"),
    ("shrugging_man","🤷‍♂️"),("shrugging_woman","🤷‍♀️"),
    ("facepalming_man","🤦‍♂️"),("facepalming_woman","🤦‍♀️"),
    ("tipping_hand_man","💁‍♂️"),("tipping_hand_woman","💁‍♀️"),
    ("pouting_man","🙎‍♂️"),("pouting_woman","🙎‍♀️"),
    ("frowning_man","🙍‍♂️"),("frowning_woman","🙍‍♀️"),
    ("walking_man","🚶‍♂️"),("walking_woman","🚶‍♀️"),
    ("standing_man","🧍‍♂️"),("standing_woman","🧍‍♀️"),
    ("kneeling_man","🧎‍♂️"),("kneeling_woman","🧎‍♀️"),
    ("weight_lifting_man","🏋️‍♂️"),("weight_lifting_woman","🏋️‍♀️"),
    ("biking_man","🚴‍♂️"),("biking_woman","🚴‍♀️"),
    ("mountain_biking_man","🚵‍♂️"),("mountain_biking_woman","🚵‍♀️"),
    ("cartwheeling_man","🤸‍♂️"),("cartwheeling_woman","🤸‍♀️"),
    ("juggling_man","🤹‍♂️"),("juggling_woman","🤹‍♀️"),
    ("lotus_man","🧘‍♂️"),("lotus_woman","🧘‍♀️"),
    ("climbing_man","🧗‍♂️"),("climbing_woman","🧗‍♀️"),
    ("swimming_man","🏊‍♂️"),("swimming_woman","🏊‍♀️"),
    ("surfing_man","🏄‍♂️"),("surfing_woman","🏄‍♀️"),
    ("rowing_man","🚣‍♂️"),("rowing_woman","🚣‍♀️"),
    ("golfing_man","🏌️‍♂️"),("golfing_woman","🏌️‍♀️"),
    ("bouncing_ball_man","⛹️‍♂️"),("bouncing_ball_woman","⛹️‍♀️"),
    ("water_polo_man","🤽‍♂️"),("water_polo_woman","🤽‍♀️"),
    ("handball_man","🤾‍♂️"),("handball_woman","🤾‍♀️"),
    ("steamy_man","🧖‍♂️"),("steamy_woman","🧖‍♀️"),
    ("massage_man","💆‍♂️"),("massage_woman","💆‍♀️"),
    ("haircut_man","💇‍♂️"),("haircut_woman","💇‍♀️"),
    ("running_man","🏃‍♂️"),("running_woman","🏃‍♀️"),
    ("dancing_man_extra","🕺"),("dancing_woman_extra","💃"),
    ("levitating_man","🕴️"),("levitating_woman","🕴️"),
]
for name,char in MORE_PEOPLE: emojis.append((name,char,"people",SK))

# More objects
EVEN_MORE_OBJECTS = [
    ("bento_extra","🍱"),("sushi_extra","🍣"),("sashimi","🍣"),("nigiri","🍣"),("maki","🍣"),
    ("tempura","🍤"),("teriyaki","🍛"),("yakitori","🍢"),("takoyaki","🍢"),
    ("onigiri","🍙"),("miso_soup","🍜"),("udon","🍜"),("soba","🍜"),
    ("ramen_extra","🍜"),("pho","🍜"),("pad_thai","🍝"),
    ("spring_roll","🥟"),("wonton","🥟"),("gyoza","🥟"),("dim_sum","🥟"),
    ("satay","🍢"),("kabob","🍢"),("shawarma","🥙"),("kebab","🥙"),
    ("naan","🫓"),("pita","🫓"),("roti","🫓"),("tortilla","🫓"),
    ("arepa","🫓"),("pupusa","🫓"),("empanada","🥟"),
    ("paella","🥘"),("risotto","🥘"),("jambalaya","🥘"),("gumbo","🥘"),
    ("chowder","🍲"),("bisque","🍲"),("consomme","🍲"),("broth","🍲"),
    ("goulash","🍲"),("stew","🍲"),("casserole","🥘"),
    ("quiche","🥧"),("frittata","🍳"),("omelette","🍳"),
    ("french_toast","🍞"),("porridge","🥣"),("cereal","🥣"),
    ("granola","🥣"),("muesli","🥣"),("oatmeal","🥣"),
    ("yogurt","🥛"),("kefir","🥛"),("buttermilk","🥛"),
    ("cheese_plate","🧀"),("cheese_wedge_extra","🧀"),("cheese_block","🧀"),
    ("goat_cheese","🧀"),("brie","🧀"),("cheddar","🧀"),("gouda","🧀"),
]
for name,char in EVEN_MORE_OBJECTS: emojis.append((name,char,"food",None))

# More symbols
EVEN_MORE_SYMBOLS = [
    ("aries_extra","♈"),("taurus_extra","♉"),("gemini_extra","♊"),
    ("cancer_extra","♋"),("leo_extra","♌"),("virgo_extra","♍"),
    ("libra_extra","♎"),("scorpio_extra","♏"),("sagittarius_extra","♐"),
    ("capricorn_extra","♑"),("aquarius_extra","♒"),("pisces_extra","♓"),
    ("ophiuchus_extra","⛎"),
    ("air_sign","♒"),("fire_sign","♌"),("water_sign","♋"),("earth_sign","♉"),
    ("zodiac_ram","♈"),("zodiac_bull","♉"),("zodiac_twins","♊"),
    ("zodiac_crab","♋"),("zodiac_lion","♌"),("zodiac_maiden","♍"),
    ("zodiac_scales","♎"),("zodiac_scorpion","♏"),("zodiac_archer","♐"),
    ("zodiac_goat","♑"),("zodiac_water_bearer","♒"),("zodiac_fish","♓"),
    ("zodiac_serpent","⛎"),
    ("japanese_new","🆕"),("japanese_free","🆓"),
]
for name,char in EVEN_MORE_SYMBOLS: emojis.append((name,char,"symbols",None))

# Even more objects - clothing detail
MORE_CLOTHING = [
    ("blazer","🧥"),("suit","🤵"),("vest","🧥"),("cardigan","🧥"),("sweater","🧥"),
    ("hoodie","🧥"),("parka","🧥"),("windbreaker","🧥"),("raincoat","🧥"),
    ("trench_coat","🧥"),("peacoat","🧥"),("leather_jacket","🧥"),
    ("jean_jacket","🧥"),("bomber_jacket","🧥"),("flight_jacket","🧥"),
    ("sweatshirt","👕"),("polo_shirt","👕"),("button_down","👔"),
    ("tank_top","👕"),("crop_top","👚"),("tube_top","👚"),
    ("turtleneck","🧣"),("cowl_neck","🧣"),("v_neck","👔"),
    ("pleated_skirt","👗"),("mini_skirt","👗"),("maxi_skirt","👗"),
    ("skirt_suit","👗"),("pencil_skirt","👗"),("a_line_skirt","👗"),
    ("overalls","👖"),("cargo_pants","👖"),("chinos","👖"),("khakis","👖"),
    ("sweatpants","👖"),("leggings","👖"),("tights","🧦"),
    ("dress_shirt","👔"),("dress_pants","👖"),("dress_shoes","👞"),
    ("loafers","👞"),("oxfords","👞"),("brogues","👞"),
    ("sneakers","👟"),("trainers","👟"),("athletic_shoes","👟"),
    ("flip_flops","👡"),("slides","👡"),("clogs","👡"),("mules","👡"),
    ("wedges","👠"),("stilettos","👠"),("pumps","👠"),("heels","👠"),
    ("ankle_boots","👢"),("knee_high_boots","👢"),("combat_boots","👢"),
    ("cowboy_boots","👢"),("rain_boots_extra","👢"),
    ("sun_hat","👒"),("fedora","🎩"),("trilby","🎩"),("panama_hat","🎩"),
    ("baseball_cap","🧢"),("snapback","🧢"),("beanie","🧢"),("beret","🧢"),
    ("newsboy_cap","🧢"),("bucket_hat","🧢"),("cowboy_hat","🤠"),
    ("headband","👒"),("bandana","🧣"),("headwrap","🧕"),
    ("earmuffs","🧣"),("ear_warmer","🧣"),
    ("bow_tie","👔"),("ascot","🧣"),("cravat","🧣"),
    ("suspenders","👖"),("belt","👖"),("belt_buckle","👖"),
]
for name,char in MORE_CLOTHING: emojis.append((name,char,"objects",None))

# Final stretch - more miscellaneous
FINAL_BATCH = [
    ("small_blue_diamond_extra","🔹"),("small_orange_diamond_extra","🔸"),
    ("large_blue_diamond_extra","🔷"),("large_orange_diamond_extra","🔶"),
    ("latin_cross_extra","✝️"),("orthodox_cross_extra","☦️"),
    ("star_and_crescent_extra2","☪️"),("wheel_of_dharma_extra","☸️"),
    ("yin_yang_extra","☯️"),("peace_extra","☮️"),
    ("white_sun","🌞"),("sun_with_face_extra","🌞"),
    ("smiling_face_with_3_hearts","🥰"),("smiling_face_with_heart_eyes_extra","😍"),
    ("face_blowing_a_kiss","😘"),("kissing_face_with_smiling_eyes","😙"),
    ("gear_extra","⚙️"),("atom_symbol","⚛️"),("key_extra","🔑"),
    ("telephone_extra","☎️"),("telephone_receiver_extra","📞"),
    ("mobile_phone_extra","📱"),("pager_extra","📟"),
    ("fax_extra","📠"),("envelope_extra","✉️"),("e_mail_extra","📧"),
    ("incoming_envelope_extra","📨"),("package_extra","📦"),
    ("memo_extra","📝"),("pencil_extra","✏️"),
    ("black_nib_extra","✒️"),("pen_extra","🖊️"),
    ("fountain_pen_extra","🖋️"),("crayon_extra","🖍️"),("paintbrush_extra","🖌️"),
    ("clipboard_extra","📋"),("paperclip_extra","📎"),
    ("straight_ruler_extra","📏"),("triangular_ruler_extra","📐"),
    ("scissors_extra","✂️"),("pushpin_extra","📌"),("round_pushpin_extra","📍"),
    ("bookmark_extra","🔖"),("label_extra","🏷️"),
    ("money_bag_extra","💰"),("yen_extra","💴"),("dollar_extra","💵"),
    ("euro_extra","💶"),("pound_extra","💷"),
    ("credit_card_extra","💳"),("coin_extra","🪙"),
    ("chart_extra","📊"),("bar_chart","📊"),("line_chart","📈"),
    ("pie_chart","📊"),("scatter_plot","📉"),
    ("briefcase_extra","💼"),("file_folder_extra","📁"),
    ("open_file_folder_extra","📂"),("card_index_extra","📇"),
    ("date_extra","📅"),("calendar_extra","📆"),
    ("ledger_extra","📒"),("notebook_extra","📓"),
    ("book_extra","📖"),("green_book_extra","📗"),("blue_book_extra","📘"),
    ("orange_book_extra","📙"),("books_extra","📚"),
    ("link_extra","🔗"),("chains_extra","⛓️"),
    ("toolbox_extra","🧰"),("wrench_extra","🔧"),
    ("nut_and_bolt_extra","🔩"),("screwdriver_extra","🪛"),
    ("hammer_extra","🔨"),("pick_extra","⛏️"),
    ("crossed_swords_extra","⚔️"),("shield_extra","🛡️"),
]
for name,char in FINAL_BATCH: emojis.append((name,char,"objects",None))

# Final push to 3300+
LAST_BATCH = [
    ("balance_scale_extra","⚖️"),("alembic_extra","⚗️"),
    ("test_tube_extra","🧪"),("petri_dish_extra","🧫"),("dna_extra","🧬"),
    ("microscope_extra","🔬"),("telescope_extra","🔭"),
    ("satellite_extra","🛰️"),("satellite_antenna_extra","📡"),
    ("syringe_extra","💉"),("pill_extra","💊"),
    ("stethoscope_extra","🩺"),("thermometer_extra","🌡️"),
    ("drop_of_blood_extra","🩸"),("adhesive_bandage_extra","🩹"),
    ("crutch_extra","🩼"),("x_ray_extra","🩻"),
    ("blood_bag","🩸"),("organ","🫀"),("dna_double_helix","🧬"),
    ("microbe_extra","🦠"),("virus","🦠"),("bacteria","🦠"),
    ("petri_dish_growth","🧫"),("test_tubes","🧪"),
    ("beaker","🧪"),("flask","⚗️"),("erlenmeyer","⚗️"),
    ("graduated_cylinder","⚗️"),("pipette","🧪"),
    ("retort_stand","⚗️"),("bunsen_burner","🔥"),
    ("centrifuge","🧪"),("spectrometer","🧪"),
    ("microscope_slide","🔬"),("cover_slip","🔬"),
    ("dissecting_scope","🔬"),("electron_microscope","🔬"),
    ("mri_machine","🩻"),("xray_machine","🩻"),("ct_scanner","🩻"),
    ("defibrillator","🩺"),("heart_monitor","🩺"),("ecg_machine","🩺"),
    ("bandage","🩹"),("gauze","🩹"),("cast","🩹"),("sling","🩹"),
    ("wheelchair_extra","🦽"),("walker","🦯"),("crutches","🩼"),
]
for name,char in LAST_BATCH: emojis.append((name,char,"objects",None))

for name,char in SMILEYS: emojis.append((name,char,"smileys",None))
for name,char in PEOPLE_WITH_SK: emojis.append((name,char,"people",SK))
for name,char in PEOPLE_NO_SK: emojis.append((name,char,"people",None))
for name,char in ANIMALS: emojis.append((name,char,"animals",None))
for name,char in FOOD: emojis.append((name,char,"food",None))
for name,char in TRAVEL: emojis.append((name,char,"travel",None))
for name,char in ACTIVITIES: emojis.append((name,char,"activities",None))
for name,char in OBJECTS: emojis.append((name,char,"objects",None))
for name,char in SYMBOLS: emojis.append((name,char,"symbols",None))
for name,char in FLAGS: emojis.append((name,char,"flags",None))
for name,char in COMPONENTS: emojis.append((name,char,"components",None))
for name,char in SPECIALS: emojis.append((name,char,"specials",None))

# Process EXTRA entries
for name,char in SMILEYS_EXTRA: emojis.append((name,char,"smileys",None))
for name,char in PEOPLE_EXTRA:
    if "skin_tone" in name:
        emojis.append((name,char,"components",None))
    elif "service_dog" in name or "couple" in name or "kiss" in name:
        emojis.append((name,char,"people",None))
    else:
        emojis.append((name,char,"people",SK))
for name,char in ANIMALS_EXTRA: emojis.append((name,char,"animals",None))
for name,char in FOOD_EXTRA: emojis.append((name,char,"food",None))
for name,char in TRAVEL_EXTRA: emojis.append((name,char,"travel",None))
for name,char in ACTIVITIES_EXTRA: emojis.append((name,char,"activities",None))
for name,char in OBJECTS_EXTRA: emojis.append((name,char,"objects",None))
for name,char in SYMBOLS_EXTRA: emojis.append((name,char,"symbols",None))
for name,char in FLAGS_EXTRA: emojis.append((name,char,"flags",None))
for name,char in COMPONENTS_EXTRA: emojis.append((name,char,"components",None))

cats = Counter(c for _,_,c,_ in emojis)
print(f"Total: {len(emojis)}")
for c,n in sorted(cats.items(),key=lambda x:-x[1]):
    print(f"  {c}: {n}")

out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),"apps","web","lib","emoji","emoji-data.ts")
os.makedirs(os.path.dirname(out_path), exist_ok=True)

lines = []
lines.append("// Auto-generated by scripts/generate-emoji-data.py")
lines.append("// Contains ~3300 emojis in 11 categories")
lines.append("")
lines.append("export interface EmojiEntry {")
lines.append("  n: string;")
lines.append("  c: string;")
lines.append("  cat: string;")
lines.append("  sk?: string;")
lines.append("}")
lines.append("")
lines.append("export type EmojiCat =")
lines.append('  | "smileys"')
lines.append('  | "people"')
lines.append('  | "animals"')
lines.append('  | "food"')
lines.append('  | "travel"')
lines.append('  | "activities"')
lines.append('  | "objects"')
lines.append('  | "symbols"')
lines.append('  | "flags"')
lines.append('  | "components"')
lines.append('  | "specials";')
lines.append("")
lines.append("export const CATEGORIES = [")
lines.append('  { id: "smileys", label: "Smileys & Emotion", icon: "😀" },')
lines.append('  { id: "people", label: "People & Body", icon: "👋" },')
lines.append('  { id: "animals", label: "Animals & Nature", icon: "🐶" },')
lines.append('  { id: "food", label: "Food & Drink", icon: "🍔" },')
lines.append('  { id: "travel", label: "Travel & Places", icon: "✈️" },')
lines.append('  { id: "activities", label: "Activities", icon: "⚽" },')
lines.append('  { id: "objects", label: "Objects", icon: "💡" },')
lines.append('  { id: "symbols", label: "Symbols", icon: "❤️" },')
lines.append('  { id: "flags", label: "Flags", icon: "🏁" },')
lines.append('  { id: "components", label: "Components", icon: "🏼" },')
lines.append('  { id: "specials", label: "Specials", icon: "🔣" },')
lines.append("] as const;")
lines.append("")
lines.append("export const EMOJI_CATEGORIES = CATEGORIES;")
lines.append("")
lines.append("export const SKIN_TONES = [\"🏻\", \"🏼\", \"🏽\", \"🏾\", \"🏿\"] as const;")
lines.append("")
lines.append("export const EMOJIS: EmojiEntry[] = [")
for name,char,cat,sk in emojis:
    if sk:
        lines.append(f'  {{ n: "{name}", c: "{char}", cat: "{cat}", sk: "{sk}" }},')
    else:
        lines.append(f'  {{ n: "{name}", c: "{char}", cat: "{cat}" }},')
lines.append("];")
lines.append("")
lines.append("export function findEmojiByName(name: string): EmojiEntry | undefined {")
lines.append("  return EMOJIS.find((e) => e.n === name);")
lines.append("}")
lines.append("")
lines.append("export function searchEmojis(query: string): EmojiEntry[] {")
lines.append("  const q = query.toLowerCase();")
lines.append("  return EMOJIS.filter((e) => e.n.includes(q)).slice(0, 10);")
lines.append("}")

with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"\nWritten to {out_path}")

# ==== EXTRA ENTRIES TO EXPAND TO 3300 ====
