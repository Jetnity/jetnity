/** One mounted reader's external clock observation. A failed clock observation
 * poisons the attempt permanently. Only an explicit new request can start a
 * new attempt; rerenders, clock rollback and visibility never renew a lease. */
export class AcceptedStoreDisplayClock {
  private state:'idle'|'pending'|'current'|'expired'='idle'
  private sequence=0
  private scope=''
  private wall=0
  private monotonic=0
  private deadline=0
  private wallExpiry=0
  private readonly listeners=new Set<()=>void>()
  readonly subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener)}}
  readonly serverSnapshot=()=>'idle' as const
  readonly snapshot=(scope:string,available:boolean)=>{
    if((this.state==='pending'||this.state==='current')&&(!available||scope!==this.scope))this.expire(this.sequence)
    this.observe();return this.state
  }
  private changed(){queueMicrotask(()=>{for(const listener of this.listeners)listener()})}
  private observe(){
    if(this.state!=='pending'&&this.state!=='current')return
    const wall=Date.now(),monotonic=performance.now()
    if(!Number.isFinite(wall)||!Number.isFinite(monotonic)||wall<this.wall||monotonic<this.monotonic
      ||this.state==='current'&&(wall>=this.wallExpiry||monotonic>=this.deadline))this.expire(this.sequence)
    this.wall=Math.max(this.wall,wall);this.monotonic=Math.max(this.monotonic,monotonic)
  }
  start(sequence:number,scope:string){
    this.sequence=sequence;this.scope=scope;this.state='pending';this.wall=Date.now();this.monotonic=performance.now();this.deadline=0;this.wallExpiry=0;this.changed()
  }
  current(sequence:number){this.observe();return sequence===this.sequence&&(this.state==='pending'||this.state==='current')}
  publish(sequence:number,deadline:number,wallExpiry:number){
    if(!this.current(sequence)||!Number.isFinite(deadline)||!Number.isFinite(wallExpiry)||deadline<=performance.now()||wallExpiry<=Date.now()){
      this.expire(sequence);return false
    }
    this.deadline=deadline;this.wallExpiry=wallExpiry;this.state='current';this.observe();this.changed();return this.state==='current'
  }
  end(sequence:number){if(sequence===this.sequence&&this.state==='pending'){this.state='idle';this.changed()}}
  expire(sequence:number){if(sequence===this.sequence&&this.state!=='expired'){this.state='expired';this.changed()}}
  cancel(){this.expire(this.sequence)}
}
