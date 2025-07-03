import Footer from "@/components/footer";
import Header from "@/components/header";
import "@/styles/globals.css";
import { montserrat, roboto } from "@/utils/fonts";




export default function Layout({children } : { children : React.ReactNode}) {
    return (
        <div className={`${roboto.variable} ${montserrat.variable}`}>
            <Header/>
            <div className="page_content">
                {children}
            </div>
            <Footer/>
        </div>
    )
}