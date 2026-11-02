<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The API lives in `api/` (Node + Express + node:sqlite) and is hosted outside Lovable (Render via render.yaml); the front-end reads its URL from VITE_API_URL, because Lovable hosting cannot persist a SQLite file.
