import { ImageResponse } from "next/og";

import { docsParams, getFont } from "../utils";

export const runtime = "edge";

export const GET = async (req: Request) => {
  const poppins = await getFont({
    family: "Poppins",
    weights: [400, 700, 900],
  });

  const parsed = docsParams.decodeRequest(req);

  if (!parsed.success) {
    return new Response(parsed.error.toString(), { status: 400 });
  }

  const props = parsed.data.input;

  return new ImageResponse(
    (
      <div
        tw="bg-zinc-900 h-full w-full flex flex-col p-14"
        style={{
          backgroundImage:
            "url(https://s40vlb3kca.ufs.sh/f/656e69ef-2800-45fd-87ac-b9f88346348c-hi270o.png)",
          backgroundPosition: "cover",
        }}
      >
        <div tw="flex flex-col w-full h-full">
          <Logo />
          <h2 tw="text-2xl mt-32 mb-0 text-red-500">{props.category}</h2>
          <h1 tw="text-5xl mt-4 mb-0 text-zinc-900">{props.title}</h1>
          <p tw="text-2xl mt-4 mb-0 text-zinc-600 w-3/4">{props.description}</p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
      fonts: [
        { name: "Poppins", data: poppins[900], weight: 900 },
        { name: "Poppins", data: poppins[700], weight: 700 },
        { name: "Poppins", data: poppins[400], weight: 400 },
      ],
    },
  );
};

const Logo = () => (
  <div tw="flex">
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300.000000 300.000000"
      preserveAspectRatio="xMidYMid meet"
      width="64px"
      height="64px"
      style={{ marginRight: 16 }}
    >
      <g
        transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)"
        fill="#B91C1C"
        stroke="none"
      >
        <path d="M2193 2980 c-111 -20 -248 -91 -339 -177 -122 -114 -210 -295 -230 -474 -7 -60 -18 -75 -29 -40 -10 32 -79 134 -121 177 -128 135 -290 206 -469 207 -181 1 -322 -59 -455 -192 -95 -96 -141 -166 -181 -280 -75 -212 -59 -449 42 -647 22 -42 38 -78 37 -79 -2 -1 -23 -13 -48 -25 -153 -77 -278 -226 -343 -405 -72 -203 -58 -444 37 -633 89 -177 213 -288 398 -358 66 -25 86 -28 198 -28 112 0 133 3 200 27 216 79 374 248 445 477 9 30 18 60 20 67 3 8 27 0 71 -22 204 -103 451 -83 640 51 137 97 245 254 290 424 20 72 25 283 11 380 l-9 55 66 13 c223 42 429 232 510 470 163 479 -142 994 -602 1017 -48 2 -110 0 -139 -5z" />{" "}
      </g>
    </svg>
    <svg
      viewBox="0 0 1284 220"
      height="64px"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M78.75 119.5V52H121.875V172H80.9375V149.187H79.6875C77.0833 156.844 72.526 162.833 66.0156 167.156C59.5052 171.427 51.7708 173.563 42.8125 173.563C34.4271 173.563 27.0833 171.635 20.7813 167.781C14.5313 163.927 9.66146 158.615 6.17188 151.844C2.73438 145.073 0.989584 137.312 0.9375 128.562V52H44.0625V119.5C44.1146 125.437 45.625 130.099 48.5938 133.484C51.6146 136.87 55.8333 138.562 61.25 138.562C64.8438 138.562 67.9427 137.807 70.5469 136.297C73.2031 134.734 75.2344 132.547 76.6406 129.734C78.099 126.87 78.8021 123.458 78.75 119.5ZM137.209 217V52H180.021V72.9375H180.959C182.521 68.875 184.813 65.151 187.834 61.7656C190.854 58.3281 194.604 55.5937 199.084 53.5625C203.563 51.4792 208.771 50.4375 214.709 50.4375C222.625 50.4375 230.151 52.5469 237.287 56.7656C244.474 60.9844 250.308 67.625 254.787 76.6875C259.318 85.75 261.584 97.5208 261.584 112C261.584 125.854 259.422 137.339 255.099 146.453C250.828 155.568 245.099 162.365 237.912 166.844C230.776 171.323 222.938 173.563 214.396 173.563C208.771 173.563 203.745 172.651 199.318 170.828C194.943 168.953 191.193 166.427 188.068 163.25C184.995 160.021 182.625 156.375 180.959 152.312H180.334V217H137.209ZM179.396 112C179.396 117.833 180.151 122.885 181.662 127.156C183.224 131.375 185.412 134.656 188.224 137C191.089 139.292 194.5 140.438 198.459 140.438C202.417 140.438 205.776 139.318 208.537 137.078C211.349 134.786 213.485 131.531 214.943 127.312C216.453 123.042 217.209 117.937 217.209 112C217.209 106.062 216.453 100.984 214.943 96.7656C213.485 92.4948 211.349 89.2396 208.537 87C205.776 84.7083 202.417 83.5625 198.459 83.5625C194.5 83.5625 191.089 84.7083 188.224 87C185.412 89.2396 183.224 92.4948 181.662 96.7656C180.151 100.984 179.396 106.062 179.396 112ZM316.175 12V172H273.05V12H316.175ZM389.36 174.187C376.339 174.187 365.194 171.609 355.923 166.453C346.652 161.245 339.542 154.005 334.595 144.734C329.647 135.411 327.173 124.604 327.173 112.313C327.173 100.021 329.647 89.2396 334.595 79.9687C339.542 70.6458 346.652 63.4062 355.923 58.25C365.194 53.0417 376.339 50.4375 389.36 50.4375C402.381 50.4375 413.527 53.0417 422.798 58.25C432.069 63.4062 439.178 70.6458 444.126 79.9687C449.074 89.2396 451.548 100.021 451.548 112.313C451.548 124.604 449.074 135.411 444.126 144.734C439.178 154.005 432.069 161.245 422.798 166.453C413.527 171.609 402.381 174.187 389.36 174.187ZM389.673 142.312C393.319 142.312 396.47 141.089 399.126 138.641C401.782 136.193 403.839 132.703 405.298 128.172C406.756 123.641 407.485 118.25 407.485 112C407.485 105.698 406.756 100.307 405.298 95.8281C403.839 91.2969 401.782 87.8073 399.126 85.3594C396.47 82.9115 393.319 81.6875 389.673 81.6875C385.819 81.6875 382.511 82.9115 379.751 85.3594C376.99 87.8073 374.881 91.2969 373.423 95.8281C371.964 100.307 371.235 105.698 371.235 112C371.235 118.25 371.964 123.641 373.423 128.172C374.881 132.703 376.99 136.193 379.751 138.641C382.511 141.089 385.819 142.312 389.673 142.312ZM495.885 173.875C488.229 173.875 481.458 172.625 475.573 170.125C469.739 167.573 465.156 163.719 461.823 158.562C458.489 153.406 456.823 146.844 456.823 138.875C456.823 132.312 457.942 126.714 460.182 122.078C462.422 117.391 465.547 113.562 469.557 110.594C473.567 107.625 478.229 105.359 483.541 103.797C488.906 102.234 494.687 101.219 500.885 100.75C507.604 100.229 512.995 99.6042 517.057 98.875C521.172 98.0937 524.14 97.026 525.963 95.6719C527.786 94.2656 528.698 92.4167 528.698 90.125V89.8125C528.698 86.6875 527.5 84.2917 525.104 82.625C522.708 80.9583 519.635 80.125 515.885 80.125C511.771 80.125 508.411 81.0365 505.807 82.8594C503.255 84.6302 501.718 87.3646 501.198 91.0625H461.51C462.031 83.7708 464.349 77.0521 468.463 70.9062C472.63 64.7083 478.698 59.7604 486.666 56.0625C494.635 52.3125 504.583 50.4375 516.51 50.4375C525.104 50.4375 532.812 51.4531 539.635 53.4844C546.458 55.4635 552.265 58.25 557.057 61.8437C561.849 65.3854 565.495 69.5521 567.995 74.3437C570.547 79.0833 571.823 84.2396 571.823 89.8125V172H531.51V155.125H530.573C528.177 159.604 525.26 163.224 521.823 165.984C518.437 168.745 514.557 170.75 510.182 172C505.859 173.25 501.093 173.875 495.885 173.875ZM509.948 146.687C513.229 146.687 516.302 146.01 519.166 144.656C522.083 143.302 524.453 141.349 526.276 138.797C528.099 136.245 529.01 133.146 529.01 129.5V119.5C527.864 119.969 526.64 120.411 525.338 120.828C524.088 121.245 522.734 121.635 521.276 122C519.87 122.365 518.359 122.703 516.745 123.016C515.182 123.328 513.541 123.615 511.823 123.875C508.489 124.396 505.755 125.255 503.62 126.453C501.536 127.599 499.974 129.031 498.932 130.75C497.942 132.417 497.448 134.292 497.448 136.375C497.448 139.708 498.62 142.26 500.963 144.031C503.307 145.802 506.302 146.687 509.948 146.687ZM629.266 173.563C620.724 173.563 612.859 171.323 605.672 166.844C598.536 162.365 592.807 155.568 588.484 146.453C584.214 137.339 582.078 125.854 582.078 112C582.078 97.5208 584.318 85.75 588.797 76.6875C593.328 67.625 599.161 60.9844 606.297 56.7656C613.484 52.5469 621.036 50.4375 628.953 50.4375C634.891 50.4375 640.099 51.4792 644.578 53.5625C649.057 55.5937 652.807 58.3281 655.828 61.7656C658.849 65.151 661.141 68.875 662.703 72.9375H663.328V12H706.453V172H663.641V152.312H662.703C661.036 156.375 658.641 160.021 655.516 163.25C652.443 166.427 648.693 168.953 644.266 170.828C639.891 172.651 634.891 173.563 629.266 173.563ZM645.203 140.438C649.161 140.438 652.547 139.292 655.359 137C658.224 134.656 660.411 131.375 661.922 127.156C663.484 122.885 664.266 117.833 664.266 112C664.266 106.062 663.484 100.984 661.922 96.7656C660.411 92.4948 658.224 89.2396 655.359 87C652.547 84.7083 649.161 83.5625 645.203 83.5625C641.245 83.5625 637.859 84.7083 635.047 87C632.286 89.2396 630.151 92.4948 628.641 96.7656C627.182 100.984 626.453 106.062 626.453 112C626.453 117.937 627.182 123.042 628.641 127.312C630.151 131.531 632.286 134.786 635.047 137.078C637.859 139.318 641.245 140.438 645.203 140.438Z"
        fill="#000"
      />
      <path
        d="M792.588 52V83.25H713.525V52H792.588ZM728.838 23.25H771.963V133.406C771.963 135.073 772.249 136.479 772.822 137.625C773.395 138.719 774.28 139.552 775.478 140.125C776.676 140.646 778.213 140.906 780.088 140.906C781.39 140.906 782.9 140.75 784.619 140.438C786.39 140.125 787.692 139.865 788.525 139.656L794.775 169.969C792.848 170.542 790.088 171.245 786.494 172.078C782.952 172.911 778.733 173.458 773.838 173.719C763.942 174.24 755.634 173.224 748.916 170.672C742.197 168.068 737.145 163.979 733.759 158.406C730.374 152.833 728.733 145.854 728.838 137.469V23.25ZM855.888 104.5V172H812.763V12H854.326V74.8125H855.576C858.284 67.1562 862.789 61.1927 869.091 56.9219C875.394 52.599 882.972 50.4375 891.826 50.4375C900.315 50.4375 907.685 52.3646 913.935 56.2187C920.237 60.0729 925.107 65.3854 928.545 72.1562C932.034 78.9271 933.753 86.6875 933.701 95.4375V172H890.576V104.5C890.628 98.5625 889.144 93.901 886.123 90.5156C883.154 87.1302 878.909 85.4375 873.388 85.4375C869.899 85.4375 866.826 86.2188 864.17 87.7812C861.565 89.2917 859.534 91.4792 858.076 94.3437C856.67 97.1562 855.94 100.542 855.888 104.5ZM954.99 172V52H998.115V172H954.99ZM976.552 39.5C970.719 39.5 965.719 37.5729 961.552 33.7188C957.386 29.8646 955.302 25.2292 955.302 19.8125C955.302 14.3958 957.386 9.76041 961.552 5.90624C965.719 2.05208 970.719 0.125 976.552 0.125C982.438 0.125 987.438 2.05208 991.552 5.90624C995.719 9.76041 997.802 14.3958 997.802 19.8125C997.802 25.2292 995.719 29.8646 991.552 33.7188C987.438 37.5729 982.438 39.5 976.552 39.5ZM1063.21 104.5V172H1020.09V52H1061.03V74.8125H1062.28C1064.88 67.2083 1069.46 61.2448 1076.03 56.9219C1082.64 52.599 1090.35 50.4375 1099.15 50.4375C1107.64 50.4375 1115.01 52.3906 1121.26 56.2969C1127.56 60.151 1132.43 65.4635 1135.87 72.2344C1139.36 79.0052 1141.08 86.7396 1141.03 95.4375V172H1097.9V104.5C1097.95 98.5625 1096.44 93.901 1093.37 90.5156C1090.35 87.1302 1086.13 85.4375 1080.71 85.4375C1077.17 85.4375 1074.07 86.2188 1071.42 87.7812C1068.81 89.2917 1066.81 91.4792 1065.4 94.3437C1063.99 97.1562 1063.26 100.542 1063.21 104.5ZM1220.13 219.5C1208.1 219.5 1197.78 217.781 1189.19 214.344C1180.65 210.958 1174.01 206.271 1169.27 200.281C1164.58 194.344 1161.95 187.521 1161.38 179.812H1202.94C1203.36 182.365 1204.4 184.422 1206.06 185.984C1207.73 187.547 1209.87 188.667 1212.47 189.344C1215.13 190.073 1218.1 190.438 1221.38 190.438C1226.95 190.438 1231.56 189.083 1235.2 186.375C1238.9 183.667 1240.75 178.771 1240.75 171.687V151.375H1239.5C1237.94 155.437 1235.54 158.901 1232.31 161.766C1229.08 164.578 1225.2 166.74 1220.67 168.25C1216.14 169.708 1211.17 170.437 1205.75 170.437C1197.21 170.437 1189.35 168.458 1182.16 164.5C1175.02 160.542 1169.29 154.266 1164.97 145.672C1160.7 137.078 1158.56 125.854 1158.56 112C1158.56 97.5208 1160.8 85.75 1165.28 76.6875C1169.81 67.625 1175.65 60.9844 1182.78 56.7656C1189.97 52.5469 1197.52 50.4375 1205.44 50.4375C1211.38 50.4375 1216.58 51.4792 1221.06 53.5625C1225.54 55.5937 1229.29 58.3281 1232.31 61.7656C1235.33 65.151 1237.63 68.875 1239.19 72.9375H1240.13V52H1283.25V171.687C1283.25 181.844 1280.62 190.464 1275.36 197.547C1270.15 204.682 1262.81 210.125 1253.33 213.875C1243.85 217.625 1232.78 219.5 1220.13 219.5ZM1221.69 139.812C1225.65 139.812 1229.03 138.719 1231.85 136.531C1234.71 134.292 1236.9 131.115 1238.41 127C1239.97 122.833 1240.75 117.833 1240.75 112C1240.75 106.062 1239.97 100.984 1238.41 96.7656C1236.9 92.4948 1234.71 89.2396 1231.85 87C1229.03 84.7083 1225.65 83.5625 1221.69 83.5625C1217.73 83.5625 1214.35 84.7083 1211.53 87C1208.77 89.2396 1206.64 92.4948 1205.13 96.7656C1203.67 100.984 1202.94 106.062 1202.94 112C1202.94 117.937 1203.67 122.99 1205.13 127.156C1206.64 131.271 1208.77 134.422 1211.53 136.609C1214.35 138.745 1217.73 139.812 1221.69 139.812Z"
        fill="#B91C1C"
      />
    </svg>
  </div>
);
