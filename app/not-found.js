import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="rb-wrap">
      <h1 className="rb-thread-title">ఈ చర్చ దొరకలేదు</h1>
      <p className="rb-empty">తీసేసి ఉండవచ్చు, లేదా లింక్ తప్పు కావచ్చు. <Link href="/">రచ్చబండకు వెళ్ళండి →</Link></p>
    </div>
  )
}
